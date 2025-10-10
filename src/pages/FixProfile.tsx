import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function FixProfile() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFix = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in first");
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('fix-profile-user-id', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Profile fixed! Please log out and log in again.");
        console.log('Fix result:', data);
        
        // Log out after fixing
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/auth');
        }, 2000);
      } else {
        throw new Error(data?.error || 'Failed to fix profile');
      }
    } catch (error: any) {
      toast.error(`Failed to fix profile: ${error.message}`);
      console.error('Error fixing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fix Profile Database Error</CardTitle>
          <CardDescription>
            This tool fixes the "Database error querying schema" issue by correcting the user_id mismatch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you're seeing a "Database error querying schema" error when logging in, click the button below to fix it.
          </p>
          <Button 
            onClick={handleFix} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Fixing..." : "Fix Profile Error"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
