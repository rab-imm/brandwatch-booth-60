import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SigningField } from "@/components/signature/SigningField";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";

export default function SigningSession() {
  const { token: accessToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [completed, setCompleted] = useState(false);

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

  const handleFieldComplete = (fieldId: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const getCompletionProgress = () => {
    if (!sessionData?.fields) return 0;
    const requiredFields = sessionData.fields.filter((f: any) => f.is_required);
    if (requiredFields.length === 0) return 100;
    
    const completedRequired = requiredFields.filter((f: any) => fieldValues[f.id]).length;
    return (completedRequired / requiredFields.length) * 100;
  };

  const canSubmit = () => {
    if (!sessionData?.fields) return false;
    const requiredFields = sessionData.fields.filter((f: any) => f.is_required);
    return requiredFields.every((f: any) => fieldValues[f.id]);
  };

  const handleSign = async () => {
    if (!canSubmit()) {
      toast({
        title: "Missing required fields",
        description: "Please complete all required fields before signing",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);
    try {
      const { error } = await supabase.functions.invoke("submit-signature", {
        body: {
          access_token: accessToken,
          session_token: sessionData.session_token,
          field_values: fieldValues,
        },
      });

      if (error) throw error;

      setCompleted(true);
      toast({
        title: "Document signed successfully",
        description: "Thank you for completing the signature request",
      });
    } catch (err: any) {
      console.error("Error signing document:", err);
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

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Document Signed!</h2>
              <p className="text-muted-foreground">
                Your signature has been successfully submitted.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/")}>
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion Progress</span>
                <span className="font-medium">{Math.round(getCompletionProgress())}%</span>
              </div>
              <Progress value={getCompletionProgress()} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {sessionData.fields?.filter((f: any) => fieldValues[f.id]).length || 0} of{" "}
                  {sessionData.fields?.length || 0} fields completed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>Review the document and complete required fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative bg-background border rounded-lg p-8 min-h-[800px]">
              <pre className="whitespace-pre-wrap font-serif text-sm relative z-0">
                {sessionData.letter?.content}
              </pre>
              
              {/* Render interactive fields */}
              {sessionData.fields?.map((field: any) => (
                <SigningField
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id]}
                  onComplete={handleFieldComplete}
                />
              ))}
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
                disabled={signing || !canSubmit()}
              >
                {signing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sign Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
