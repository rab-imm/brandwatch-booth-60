import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { IconUpload, IconUsers, IconAlertTriangle } from "@tabler/icons-react";

export const BulkUserOperations = () => {
  const [operation, setOperation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleExecute = async () => {
    if (!operation) {
      toast.error("Please select an operation");
      return;
    }

    if (!file) {
      toast.error("Please upload a CSV file");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Read CSV file
      const text = await file.text();
      const rows = text.split("\n").map((row) => row.split(","));
      const userIds = rows.slice(1).map((row) => row[0].trim()).filter(Boolean);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke("bulk-user-operations", {
        body: {
          operation,
          user_ids: userIds,
          data: operation === "allocate_credits" ? { amount: creditAmount } : {},
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResults(data);
      toast.success(`Bulk operation completed: ${data.affected} users processed`);
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUsers className="h-5 w-5" />
          Bulk User Operations
        </CardTitle>
        <CardDescription>
          Perform operations on multiple users at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bulk operations cannot be undone. Please review carefully before executing.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Operation Type</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allocate_credits">Allocate Credits</SelectItem>
                <SelectItem value="suspend">Suspend Accounts</SelectItem>
                <SelectItem value="activate">Activate Accounts</SelectItem>
                <SelectItem value="change_role">Change Role</SelectItem>
                <SelectItem value="delete">Delete Accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === "allocate_credits" && (
            <div className="space-y-2">
              <Label>Credit Amount</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter credit amount"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".csv" onChange={handleFileUpload} />
              <IconUpload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              CSV format: user_id (one per line, with header)
            </p>
          </div>

          {loading && (
            <div className="space-y-2">
              <Label>Progress</Label>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% complete
              </p>
            </div>
          )}

          {results && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Operation Results</h4>
              <p className="text-sm">
                Successfully processed: {results.affected} users
              </p>
              {results.errors && results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-destructive">Errors:</p>
                  <ul className="text-xs list-disc list-inside">
                    {results.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleExecute} disabled={loading || !file || !operation} className="w-full">
            Execute Bulk Operation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
