import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";

export default function SigningSession() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  
  const accessToken = searchParams.get("token");

  useEffect(() => {
    if (accessToken) {
      loadSigningSession();
    } else {
      setError("Invalid or missing access token");
      setLoading(false);
    }
  }, [accessToken]);

  const loadSigningSession = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-signing-session", {
        body: { access_token: accessToken },
      });

      if (error) throw error;

      if (data.error) {
        if (data.already_signed) {
          setError("You have already signed this document.");
        } else if (data.expired) {
          setError("This signature request has expired.");
        } else {
          setError(data.error);
        }
        return;
      }

      setSessionData(data);
    } catch (err: any) {
      console.error("Error loading signing session:", err);
      setError(err.message || "Failed to load signing session");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      // In a complete implementation, this would:
      // 1. Capture signatures/initials/field values
      // 2. Submit to backend
      // 3. Mark as signed
      
      toast({
        title: "Signature feature coming soon",
        description: "The signature capture interface will be implemented in Phase 3",
      });
    } catch (err: any) {
      toast({
        title: "Failed to sign",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading signature request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate("/")}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) return null;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{sessionData.request.title}</CardTitle>
            <CardDescription>
              Requested by {sessionData.recipient.name} ({sessionData.recipient.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionData.request.message && (
              <Alert className="mb-4">
                <AlertDescription>{sessionData.request.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>You have {sessionData.fields?.length || 0} field(s) to complete</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>Review the document and complete required fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background border rounded-lg p-6 min-h-[600px]">
              <pre className="whitespace-pre-wrap font-serif text-sm">
                {sessionData.letter?.content}
              </pre>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSign}
                disabled={signing}
              >
                {signing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  "Sign Document"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
