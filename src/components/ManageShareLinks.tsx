import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Link2, Lock, Eye, Calendar, Ban, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ShareLink {
  id: string;
  letter_id: string;
  recipient_email: string;
  recipient_name: string | null;
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  max_views: number | null;
  view_count: number;
  is_password_protected: boolean;
  created_at: string;
  metadata: any;
}

export function ManageShareLinks({ letterId }: { letterId: string }) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchShareLinks();
  }, [letterId]);

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("letter_share_links")
        .select("*")
        .eq("letter_id", letterId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShareLinks(data || []);
    } catch (error: any) {
      console.error("Error fetching share links:", error);
      toast({
        title: "Error",
        description: "Failed to load share links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeShareLink = async (shareLinkId: string) => {
    try {
      const { error } = await supabase.functions.invoke("revoke-share-link", {
        body: { shareLinkId },
      });

      if (error) throw error;

      toast({
        title: "Share Link Revoked",
        description: "The share link has been revoked successfully",
      });

      fetchShareLinks();
    } catch (error: any) {
      console.error("Error revoking share link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke share link",
        variant: "destructive",
      });
    }
  };

  const copyShareUrl = (token: string, linkId: string) => {
    const appUrl = window.location.origin;
    const shareUrl = `${appUrl}/view-letter/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(linkId);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shareLinks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No share links created yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shareLinks.map((link) => {
        const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
        const isRevoked = !!link.revoked_at;
        const isMaxViewsReached = link.max_views && link.view_count >= link.max_views;
        const isActive = !isExpired && !isRevoked && !isMaxViewsReached;

        return (
          <Card key={link.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {link.recipient_name || link.recipient_email}
                    {link.is_password_protected && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>{link.recipient_email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <Badge variant="default">Active</Badge>
                  )}
                  {isRevoked && (
                    <Badge variant="destructive">Revoked</Badge>
                  )}
                  {isExpired && !isRevoked && (
                    <Badge variant="secondary">Expired</Badge>
                  )}
                  {isMaxViewsReached && !isRevoked && (
                    <Badge variant="secondary">Max Views</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>
                      {link.view_count}
                      {link.max_views ? ` / ${link.max_views}` : ""} views
                    </span>
                  </div>
                  {link.expires_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires {formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyShareUrl(link.token, link.id)}
                      >
                        {copiedId === link.id ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => revokeShareLink(link.id)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
