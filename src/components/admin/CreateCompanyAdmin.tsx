import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const CreateCompanyAdmin = () => {
  const [email, setEmail] = useState("addebim@gmail.com");
  const [password, setPassword] = useState("tester123");
  const [companyName, setCompanyName] = useState("Test Company");
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-company-admin', {
        body: { email, password, companyName }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Company admin account created successfully!`);
        console.log('Account created:', data);
      } else {
        throw new Error(data?.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error(`Failed to create account: ${error.message}`);
      console.error('Error creating account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Company Admin Account</CardTitle>
        <CardDescription>
          Create a new company admin account with company setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
          />
        </div>
        <Button 
          onClick={handleCreateAccount} 
          disabled={loading || !email || !password || !companyName}
          className="w-full"
        >
          {loading ? "Creating..." : "Create Company Admin Account"}
        </Button>
      </CardContent>
    </Card>
  );
};
