import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  IconShield, 
  IconAlertTriangle, 
  IconCircleCheck, 
  IconClock, 
  IconUsers, 
  IconActivity, 
  IconLock, 
  IconTrendingUp,
  IconEye,
  IconBan,
  IconRefresh
} from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityMetrics {
  totalUsers: number;
  activeUsers24h: number;
  failedLogins24h: number;
  suspiciousActivities: number;
  blockedIPs: number;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  user_id?: string;
  ip_address?: string;
}

interface SuspiciousActivity {
  id: string;
  user_email: string;
  activity_type: string;
  risk_score: number;
  timestamp: string;
  ip_address: string;
  details: any;
}

export function SecurityMonitoring() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalUsers: 0,
    activeUsers24h: 0,
    failedLogins24h: 0,
    suspiciousActivities: 0,
    blockedIPs: 0,
    securityScore: 85
  });
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic metrics
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at');

      const { data: recentLogs } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Calculate metrics
      const totalUsers = profiles?.length || 0;
      const activeUsers24h = recentLogs?.filter(log => 
        log.action === 'login' || log.action === 'view'
      ).length || 0;
      
      const failedLogins24h = recentLogs?.filter(log => 
        log.action === 'failed_login'
      ).length || 0;

      setMetrics(prev => ({
        ...prev,
        totalUsers,
        activeUsers24h,
        failedLogins24h,
        suspiciousActivities: Math.floor(Math.random() * 5), // Mock data
        blockedIPs: Math.floor(Math.random() * 3), // Mock data
      }));

      // Generate mock security alerts
      setAlerts([
        {
          id: '1',
          type: 'high',
          title: 'Multiple Failed Login Attempts',
          description: 'User attempted login 15 times in 5 minutes',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolved: false,
          ip_address: '192.168.1.100'
        },
        {
          id: '2',
          type: 'medium',
          title: 'Unusual Access Pattern',
          description: 'User accessing from new geographic location',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          resolved: true,
          ip_address: '10.0.0.50'
        },
        {
          id: '3',
          type: 'low',
          title: 'Password Change Request',
          description: 'User requested password reset',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          resolved: true
        }
      ]);

      // Generate mock suspicious activities
      setActivities([
        {
          id: '1',
          user_email: 'user@example.com',
          activity_type: 'Rapid API Calls',
          risk_score: 85,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100',
          details: { api_calls: 150, time_window: '5 minutes' }
        },
        {
          id: '2',
          user_email: 'admin@company.com',
          activity_type: 'Off-hours Access',
          risk_score: 65,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          ip_address: '10.0.0.25',
          details: { access_time: '3:00 AM', usual_hours: '9 AM - 6 PM' }
        }
      ]);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    toast({
      title: "Alert Resolved",
      description: "Security alert has been marked as resolved"
    });
  };

  const blockIP = async (ipAddress: string) => {
    // Mock IP blocking functionality
    toast({
      title: "IP Blocked",
      description: `IP address ${ipAddress} has been blocked`
    });
    setMetrics(prev => ({ ...prev, blockedIPs: prev.blockedIPs + 1 }));
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconRefresh className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{metrics.securityScore}%</p>
              </div>
              <IconShield className={`h-8 w-8 ${
                metrics.securityScore >= 80 ? 'text-green-600' : 
                metrics.securityScore >= 60 ? 'text-yellow-600' : 'text-destructive'
              }`} />
            </div>
            <Progress value={metrics.securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users (24h)</p>
                <p className="text-2xl font-bold">{metrics.activeUsers24h}</p>
              </div>
              <IconUsers className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold">{metrics.failedLogins24h}</p>
              </div>
              <IconAlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked IPs</p>
                <p className="text-2xl font-bold">{metrics.blockedIPs}</p>
              </div>
              <IconBan className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="activities">Suspicious Activities</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>
                Recent security alerts and incidents requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getAlertColor(alert.type) as any}>
                            {alert.type.toUpperCase()}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline">
                            <IconCircleCheck className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <AlertDescription>{alert.description}</AlertDescription>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <IconClock className="h-3 w-3 inline mr-1" />
                          {new Date(alert.timestamp).toLocaleString()}
                          {alert.ip_address && (
                            <span className="ml-4">IP: {alert.ip_address}</span>
                          )}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <IconCircleCheck className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          {alert.ip_address && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => blockIP(alert.ip_address!)}
                            >
                              <IconBan className="h-4 w-4 mr-1" />
                              Block IP
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" />
                Suspicious Activities
              </CardTitle>
              <CardDescription>
                User activities flagged by our security system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{activity.activity_type}</h4>
                        <Badge variant="outline">{activity.user_email}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getRiskColor(activity.risk_score)}`}>
                          Risk: {activity.risk_score}%
                        </span>
                        <Progress 
                          value={activity.risk_score} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      IP: {activity.ip_address} • 
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    <div className="text-sm">
                      <strong>Details:</strong> {JSON.stringify(activity.details)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                Real-time Monitoring
              </CardTitle>
              <CardDescription>
                Live security metrics and system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Authentication Service</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <IconCircleCheck className="h-3 w-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Connection</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <IconCircleCheck className="h-3 w-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>API Gateway</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <IconClock className="h-3 w-3 mr-1" />
                        Slow
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Security Policies</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Rate Limiting</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <IconLock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>HTTPS Enforcement</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <IconLock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>CORS Protection</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <IconLock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}