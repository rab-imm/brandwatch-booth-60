import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Mail, User, Calendar, FileCheck, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SignatureRequestStatusProps {
  letterId: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  status: string;
  signing_order: number;
  signed_at: string | null;
  viewed_at: string | null;
}

interface SignatureRequest {
  id: string;
  title: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  message: string | null;
  signing_order_enabled: boolean;
  certificate_generated?: boolean;
  certificate_url?: string;
  certificate_generated_at?: string;
}

export const SignatureRequestStatus = ({ letterId }: SignatureRequestStatusProps) => {
  const [request, setRequest] = useState<SignatureRequest | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCert, setGeneratingCert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSignatureRequest();
  }, [letterId]);

  const loadSignatureRequest = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("signature_requests")
        .select("*")
        .eq("letter_id", letterId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;
      
      if (!requestData) {
        setLoading(false);
        return;
      }

      setRequest(requestData);

      const { data: recipientsData, error: recipientsError } = await supabase
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", requestData.id)
        .order("signing_order", { ascending: true });

      if (recipientsError) throw recipientsError;

      setRecipients(recipientsData || []);
    } catch (error: any) {
      console.error("Error loading signature request:", error);
      toast({
        title: "Failed to load signature status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (recipientId: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-reminder-email", {
        body: { recipient_id: recipientId },
      });

      if (error) throw error;

      toast({
        title: "Reminder sent",
        description: "A reminder email has been sent to the recipient",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCompletionPercentage = () => {
    if (recipients.length === 0) return 0;
    const signed = recipients.filter(r => r.signed_at).length;
    return (signed / recipients.length) * 100;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "outline",
      viewed: "secondary",
      signed: "default",
    };
    return variants[status] || "outline";
  };

  const handleGenerateCertificate = async () => {
    if (!request) return;

    setGeneratingCert(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-signature-certificate", {
        body: { signature_request_id: request.id },
      });

      if (error) throw error;

      toast({
        title: "Certificate generated",
        description: "Your signature certificate is ready",
      });

      // Reload request to get updated certificate info
      loadSignatureRequest();
    } catch (error: any) {
      toast({
        title: "Failed to generate certificate",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingCert(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading signature status...
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return null;
  }

  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Signature Request Status</CardTitle>
          <Badge variant={request.status === "completed" ? "default" : "secondary"}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Completion Progress</span>
            <span className="text-muted-foreground">
              {Math.round(getCompletionPercentage())}%
            </span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {recipients.filter(r => r.signed_at).length} of {recipients.length} signatures collected
          </p>
        </div>

        {/* Certificate Generation */}
        {request.status === "completed" && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Digital Certificate
            </h4>
            {request.certificate_generated ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Certificate Generated</p>
                    <p className="text-xs text-muted-foreground">
                      Created {request.certificate_generated_at && 
                        formatDistanceToNow(new Date(request.certificate_generated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={request.certificate_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleGenerateCertificate}
                disabled={generatingCert}
                variant="outline"
                className="w-full"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                {generatingCert ? "Generating..." : "Generate Certificate"}
              </Button>
            )}
          </div>
        )}

        {/* Expiry Warning */}
        {isExpired && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              This signature request has expired
            </p>
          </div>
        )}

        {request.expires_at && !isExpired && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Expires {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Recipients List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recipients</h4>
          {recipients.map((recipient, index) => (
            <div
              key={recipient.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{recipient.name}</p>
                    {request.signing_order_enabled && (
                      <Badge variant="outline" className="text-xs">
                        #{recipient.signing_order}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{recipient.email}</p>
                </div>
                <Badge variant={getStatusBadge(recipient.status)}>
                  {recipient.status}
                </Badge>
              </div>

              {/* Status Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {recipient.viewed_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Viewed {formatDistanceToNow(new Date(recipient.viewed_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {recipient.signed_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>
                      Signed {formatDistanceToNow(new Date(recipient.signed_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {/* Send Reminder */}
              {!recipient.signed_at && !isExpired && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReminder(recipient.id)}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
