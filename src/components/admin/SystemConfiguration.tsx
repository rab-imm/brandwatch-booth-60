import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSettings, IconDatabase, IconShield, IconKey, IconGlobe } from '@tabler/icons-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSettings {
  maintenanceMode: boolean;
  rateLimiting: boolean;
  newUserRegistration: boolean;
  emailVerification: boolean;
  maxQueriesPerUser: number;
  apiVersion: string;
  securityLevel: string;
}

export function SystemConfiguration() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    rateLimiting: true,
    newUserRegistration: true,
    emailVerification: true,
    maxQueriesPerUser: 50,
    apiVersion: 'v1',
    securityLevel: 'standard'
  });
  
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting Updated",
      description: `${key} has been updated successfully`
    });
  };

  const handleSaveConfiguration = () => {
    toast({
      title: "Configuration Saved",
      description: "System configuration has been saved successfully"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage platform settings, features, and integrations
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconGlobe className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Maintenance Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Enable to temporarily disable the platform for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">New User Registration</label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register for accounts
                  </p>
                </div>
                <Switch
                  checked={settings.newUserRegistration}
                  onCheckedChange={(checked) => handleSettingChange('newUserRegistration', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Email Verification</label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  checked={settings.emailVerification}
                  onCheckedChange={(checked) => handleSettingChange('emailVerification', checked)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Queries Per User</label>
                <Input
                  type="number"
                  value={settings.maxQueriesPerUser}
                  onChange={(e) => handleSettingChange('maxQueriesPerUser', parseInt(e.target.value))}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Version</label>
                <Select 
                  value={settings.apiVersion} 
                  onValueChange={(value) => handleSettingChange('apiVersion', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1.0</SelectItem>
                    <SelectItem value="v2">v2.0 (Beta)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Rate Limiting</label>
                  <p className="text-sm text-muted-foreground">
                    Enable rate limiting to prevent abuse
                  </p>
                </div>
                <Switch
                  checked={settings.rateLimiting}
                  onCheckedChange={(checked) => handleSettingChange('rateLimiting', checked)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Security Level</label>
                <Select 
                  value={settings.securityLevel} 
                  onValueChange={(value) => handleSettingChange('securityLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Security Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HTTPS Enabled</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2FA Required</span>
                      <Badge variant="secondary">Optional</Badge>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Password Policy</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Strong</Badge>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Session Timeout</span>
                      <Badge variant="outline">24 hours</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">API Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm">OpenAI API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm">Supabase API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm">Stripe API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                External Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Email Service</h4>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Resend email delivery service</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Configure
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Payment Gateway</h4>
                    <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Stripe payment processing</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Configure
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Analytics</h4>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Google Analytics integration</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Setup
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Monitoring</h4>
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Error tracking and monitoring</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleSaveConfiguration} className="w-full">
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}