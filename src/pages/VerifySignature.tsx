import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Shield, Search, User, Mail, Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VerificationResult {
  request_id: string;
  document_title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  recipients: Array<{
    name: string;
    email: string;
    role: string;
    signed_at: string | null;
    status: string;
    ip_address: string | null;
    user_agent: string | null;
    is_verified: boolean;
    fields_count: number;
  }>;
  is_complete: boolean;
  is_valid: boolean;
}

export default function VerifySignature() {
  const [searchParams] = useSearchParams();
  const [requestId, setRequestId] = useState(searchParams.get("id") || "");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!requestId.trim()) {
      setError("Please enter a signature request ID");
      return;
    }

    setLoading(true);
    setError(null);
    setVerification(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke("verify-signature", {
        body: {
          signature_request_id: requestId.trim(),
          recipient_email: recipientEmail.trim() || undefined,
        },
      });

      if (verifyError) throw verifyError;

      setVerification(data as VerificationResult);
    } catch (err: any) {
      setError(err.message || "Failed to verify signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold mb-2">Verify Digital Signature</h1>
        <p className="text-muted-foreground">
          Confirm the authenticity and validity of signed documents
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification Details</CardTitle>
          <CardDescription>
            Enter the signature request ID to verify the document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestId">Signature Request ID</Label>
            <Input
              id="requestId"
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Filter results for a specific recipient
            </p>
          </div>

          <Button onClick={handleVerify} disabled={loading} className="w-full" size="lg">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Verifying..." : "Verify Signature"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {verification && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verification Result</CardTitle>
                {verification.is_valid ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Invalid
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Document Title</p>
                  <p className="font-medium">{verification.document_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={verification.status === "completed" ? "default" : "secondary"}>
                    {verification.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(verification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {verification.completed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(verification.completed_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signatories ({verification.recipients.length})</CardTitle>
              <CardDescription>
                Details of all recipients and their signing status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verification.recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{recipient.name}</p>
                        {recipient.is_verified ? (
                          <Badge className="bg-green-500 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{recipient.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{recipient.role}</Badge>
                  </div>

                  {recipient.signed_at && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Signed {formatDistanceToNow(new Date(recipient.signed_at), { addSuffix: true })}
                        </span>
                      </div>

                      {recipient.ip_address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground font-mono text-xs">
                            IP: {recipient.ip_address}
                          </span>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        {recipient.fields_count} field{recipient.fields_count !== 1 ? 's' : ''} completed
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {verification.is_complete && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                This document has been successfully signed by all required parties and is legally valid.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
