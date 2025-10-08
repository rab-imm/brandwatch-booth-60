import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { IconReportAnalytics } from "@tabler/icons-react";

const METRICS = ["revenue", "users", "conversions", "retention", "churn"];
const CHART_TYPES = ["line", "bar", "pie", "area"];

export const CustomReportBuilder = () => {
  const [reportName, setReportName] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartType, setChartType] = useState("line");

  const handleSave = () => {
    toast.success("Report template saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconReportAnalytics className="h-5 w-5" />
          Custom Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Report name" />
        <div className="space-y-2">
          <Label>Metrics</Label>
          {METRICS.map((m) => (
            <div key={m} className="flex items-center space-x-2">
              <Checkbox id={m} onCheckedChange={(checked) => {
                if (checked) setSelectedMetrics([...selectedMetrics, m]);
                else setSelectedMetrics(selectedMetrics.filter(x => x !== m));
              }} />
              <label htmlFor={m}>{m}</label>
            </div>
          ))}
        </div>
        <Button onClick={handleSave}>Save Template</Button>
      </CardContent>
    </Card>
  );
};
