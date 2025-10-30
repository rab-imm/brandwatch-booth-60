import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, AlertTriangle, Clock, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ViewSharedLetter() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [letter, setLetter] = useState<any>(null);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewStartTime] = useState(Date.now());

  useEffect(() => {
    if (token) {
      trackView();
    }
  }, [token]);

  useEffect(() => {
    return () => {
      // Track view duration on unmount
      if (letter && token) {
        const durationSeconds = Math.floor((Date.now() - viewStartTime) / 1000);
        trackViewDuration(durationSeconds);
      }
    };
  }, [letter, token, viewStartTime]);

  const trackView = async (pwd?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: trackError } = await supabase.functions.invoke(
        "track-letter-view",
        {
          body: { 
            token,
            password: pwd || password 
          },
        }
      );

      if (trackError) throw trackError;

      if (data.error) {
        if (data.error === "Password required") {
          setShowPasswordInput(true);
          setError("This letter is password protected");
        } else {
          setError(data.error);
        }
        return;
      }

      setLetter({
        ...data.letter,
        content: String(data.letter.content || '')
      });
      // Map the response from edge function to shareInfo structure
      setShareInfo({
        sender_name: data.recipientName,
        view_count: data.viewCount || 0,
      });
    } catch (err: any) {
      console.error("Error tracking view:", err);
      setError(err.message || "Failed to load letter");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!letter) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${letter.title}</title>
        </head>
        <body>
          <h1>${letter.title}</h1>
          <p><strong>Type:</strong> ${letter.letter_type}</p>
          <p><strong>Created:</strong> ${new Date(letter.created_at).toLocaleDateString()}</p>
          <hr>
          ${letter.content}
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.title.replace(/[^a-z0-9]/gi, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Document Downloaded",
      description: "The letter has been downloaded to your device.",
    });
  };

  const trackViewDuration = async (durationSeconds: number) => {
    try {
      await supabase.functions.invoke("track-letter-view", {
        body: { 
          token,
          viewDurationSeconds: durationSeconds 
        },
      });
    } catch (err) {
      console.error("Error tracking view duration:", err);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackView(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading shared letter...</p>
        </div>
      </div>
    );
  }

  if (error && !showPasswordInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate("/")}
              className="w-full mt-4"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPasswordInput && !letter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Password Protected</CardTitle>
            </div>
            <CardDescription>
              This letter requires a password to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                View Letter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!letter) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Share Info Banner */}
        {shareInfo && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  <span>
                    Shared by {shareInfo.sender_name || shareInfo.sender_email}
                  </span>
                </div>
                {shareInfo.expires_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expires: {new Date(shareInfo.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {shareInfo.max_views && (
                  <div className="text-sm text-muted-foreground">
                    Views remaining: {shareInfo.max_views - shareInfo.view_count}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Letter Content */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{letter.title}</CardTitle>
                <CardDescription>
                  Type: {letter.letter_type} • Created:{" "}
                  {new Date(letter.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-card border rounded-lg p-6 min-h-[400px]">
              <div className="prose prose-base max-w-none dark:prose-invert font-serif">
                <ReactMarkdown 
                  key={letter.id}
                  remarkPlugins={[remarkGfm]}
                >
                  {letter.content}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            This letter was shared securely via UAE Legal Assistant
          </p>
        </div>
      </div>
    </div>
  );
}
