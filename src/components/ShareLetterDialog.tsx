import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Copy, Mail, Loader2, Check } from "lucide-react";
import { ContactSelector } from "@/components/contacts/ContactSelector";

interface ShareLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letterId: string;
  letterTitle: string;
}

export function ShareLetterDialog({
  open,
  onOpenChange,
  letterId,
  letterTitle,
}: ShareLetterDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [maxViews, setMaxViews] = useState<number | undefined>();
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email Required",
        description: "Please enter recipient's email address",
        variant: "destructive",
      });
      return;
    }

    if (requirePassword && !password) {
      toast({
        title: "Password Required",
        description: "Please enter a password to protect this link",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create share link
      const { data, error } = await supabase.functions.invoke("create-share-link", {
        body: {
          letterId,
          recipientEmail,
          recipientName: recipientName || undefined,
          expiresInDays: expiresInDays || undefined,
          maxViews: maxViews || undefined,
          requirePassword,
          password: requirePassword ? password : undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setShareUrl(data.shareLink.url);

      // Send email notification if requested
      if (sendEmail) {
        // Get letter content for the email
        const { data: letterData } = await supabase
          .from("letters" as any)
          .select("content")
          .eq("id", letterId)
          .single();

        // Get current user's profile for sender name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { error: emailError } = await supabase.functions.invoke(
          "send-letter-share-notification",
          {
            body: {
              recipientEmail,
              recipientName: recipientName || recipientEmail,
              senderName: profile?.full_name || profile?.email || "UAE Legal Assistant",
              letterTitle,
              letterContent: (letterData as any)?.content, // Include the letter content
              shareLink: data.shareLink.url,
              expiresAt: data.shareLink.expires_at,
              maxViews: data.shareLink.max_views,
              isPasswordProtected: requirePassword,
            },
          }
        );

        if (emailError) {
          console.error("Email notification error:", emailError);
          toast({
            title: "Link Created",
            description: "Share link created but email notification failed to send",
          });
        } else {
          toast({
            title: "Letter Shared Successfully",
            description: `Share link created and email sent to ${recipientEmail}`,
          });
        }
      } else {
        toast({
          title: "Share Link Created",
          description: "Copy the link below to share",
        });
      }
    } catch (error: any) {
      console.error("Error sharing letter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setRecipientEmail("");
    setRecipientName("");
    setExpiresInDays(7);
    setMaxViews(undefined);
    setRequirePassword(false);
    setPassword("");
    setSendEmail(true);
    setShareUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Letter</DialogTitle>
          <DialogDescription>
            Create a secure link to share "{letterTitle}"
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center pb-4 border-b">
              <ContactSelector
                onSelect={(contact) => {
                  setRecipientEmail(contact.email)
                  setRecipientName(contact.name)
                }}
                buttonText="Select from Contacts"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name (Optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (Days)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxViews">Max Views (Optional)</Label>
              <Input
                id="maxViews"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={maxViews || ""}
                onChange={(e) =>
                  setMaxViews(e.target.value ? parseInt(e.target.value) : undefined)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="password-protection">Password Protection</Label>
              <Switch
                id="password-protection"
                checked={requirePassword}
                onCheckedChange={setRequirePassword}
              />
            </div>

            {requirePassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="send-email">Send Email Notification</Label>
              <Switch
                id="send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Share Link
              </Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {sendEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email notification sent to {recipientEmail}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Share Link
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
