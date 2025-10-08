import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IconHistory, IconDownload, IconRestore, IconEye } from "@tabler/icons-react";
import { format } from "date-fns";

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  created_by: string;
  created_at: string;
  change_summary: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
}

export const DocumentVersionHistory = ({ documentId }: DocumentVersionHistoryProps) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState<{ old: string; new: string } | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });

    if (!error && data) {
      setVersions(data as DocumentVersion[]);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version?")) return;

    setLoading(true);
    const { error } = await supabase.functions.invoke("restore-document-version", {
      body: { version_id: versionId },
    });

    if (error) {
      toast.error("Failed to restore version");
    } else {
      toast.success("Version restored successfully");
      loadVersions();
    }
    setLoading(false);
  };

  const handleCompare = (oldVersion: string, newVersion: string) => {
    setComparing({ old: oldVersion, new: newVersion });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconHistory className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>View and restore previous versions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    v{version.version_number}
                  </Badge>
                  {index === 0 && (
                    <Badge variant="outline">Current</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(version.created_at), "PPP p")}
                  </span>
                </div>
                <p className="text-sm mt-2">{version.change_summary}</p>
              </div>
              <div className="flex gap-2">
                {index < versions.length - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCompare(
                        versions[index + 1].content,
                        version.content
                      )
                    }
                  >
                    <IconEye className="h-4 w-4" />
                  </Button>
                )}
                {index !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                    disabled={loading}
                  >
                    <IconRestore className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {comparing && (
          <div className="mt-6 p-4 border rounded-lg">
            <h4 className="font-medium mb-4">Version Comparison</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Previous Version</p>
                <div className="bg-muted p-3 rounded text-sm max-h-96 overflow-y-auto">
                  {comparing.old}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Selected Version</p>
                <div className="bg-muted p-3 rounded text-sm max-h-96 overflow-y-auto">
                  {comparing.new}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setComparing(null)}
            >
              Close Comparison
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
