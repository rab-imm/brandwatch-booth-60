import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconSearch, IconDownload, IconFilter, IconEye, IconAlertTriangle, IconInfoCircle, IconCircleCheck } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, resourceFilter, timeFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply time filter
      if (timeFilter !== 'all') {
        const timeMap = {
          '1h': '1 hour',
          '24h': '24 hours',
          '7d': '7 days',
          '30d': '30 days'
        };
        query = query.gte('created_at', `now() - interval '${timeMap[timeFilter as keyof typeof timeMap]}'`);
      }

      // Apply action filter
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      // Apply resource filter
      if (resourceFilter !== 'all') {
        query = query.eq('resource_type', resourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedLogs = data?.map(log => ({
        ...log,
        user_email: 'user@example.com', // Mock data since we can't join with auth.users
        user_name: 'Example User',
        ip_address: log.ip_address as string
      })) || [];

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <IconInfoCircle className="h-4 w-4" />;
      case 'delete':
      case 'suspend':
        return <IconAlertTriangle className="h-4 w-4" />;
      case 'create':
      case 'approve':
        return <IconCircleCheck className="h-4 w-4" />;
      default:
        return <IconEye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'delete':
      case 'suspend':
        return 'destructive';
      case 'create':
      case 'approve':
        return 'default';
      case 'login':
      case 'logout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email || 'Unknown',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === '' || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconEye className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all administrative actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="template">Templates</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="conversation">Conversations</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportLogs} variant="outline" size="sm">
                <IconDownload className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.user_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getActionColor(log.action) as any}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getActionIcon(log.action)}
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-sm text-muted-foreground font-mono">
                              {log.resource_id.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {JSON.stringify(log.metadata).slice(0, 50)}
                              {JSON.stringify(log.metadata).length > 50 && '...'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}