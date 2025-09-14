import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconBell, IconMail, IconSend, IconUsers, IconTemplate } from '@tabler/icons-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationManagement() {
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'email'
  });
  const [broadcastMessage, setBroadcastMessage] = useState({
    title: '',
    message: '',
    type: 'info',
    targetUsers: 'all'
  });
  const { toast } = useToast();

  const handleCreateTemplate = () => {
    toast({
      title: "Template Created",
      description: "Email template has been created successfully"
    });
    setNewTemplate({ name: '', subject: '', content: '', type: 'email' });
  };

  const handleSendBroadcast = () => {
    toast({
      title: "Broadcast Sent",
      description: "Notification has been sent to selected users"
    });
    setBroadcastMessage({ title: '', message: '', type: 'info', targetUsers: 'all' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBell className="h-5 w-5" />
            Notification Management
          </CardTitle>
          <CardDescription>
            Manage email templates, broadcasts, and user communications
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast Messages</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTemplate className="h-5 w-5" />
                Create Email Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Welcome Email Template"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="notification">In-App Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Subject Line</label>
                <Input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Welcome to our platform!"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Dear {{user_name}}, welcome to our platform..."
                  className="min-h-32"
                />
              </div>
              
              <Button onClick={handleCreateTemplate} className="w-full">
                <IconTemplate className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSend className="h-5 w-5" />
                Send Broadcast Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Message Type</label>
                  <Select 
                    value={broadcastMessage.type} 
                    onValueChange={(value) => setBroadcastMessage(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Audience</label>
                  <Select 
                    value={broadcastMessage.targetUsers} 
                    onValueChange={(value) => setBroadcastMessage(prev => ({ ...prev, targetUsers: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                      <SelectItem value="companies">Company Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={broadcastMessage.title}
                  onChange={(e) => setBroadcastMessage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Important Update"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={broadcastMessage.message}
                  onChange={(e) => setBroadcastMessage(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="We have released new features..."
                  className="min-h-24"
                />
              </div>
              
              <Button onClick={handleSendBroadcast} className="w-full">
                <IconSend className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Recent notifications and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Welcome Email', type: 'email', sent: '2 hours ago', status: 'delivered' },
                  { title: 'Platform Update', type: 'broadcast', sent: '1 day ago', status: 'delivered' },
                  { title: 'Security Alert', type: 'notification', sent: '3 days ago', status: 'read' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <IconMail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.type} • {item.sent}</div>
                      </div>
                    </div>
                    <Badge variant={item.status === 'delivered' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}