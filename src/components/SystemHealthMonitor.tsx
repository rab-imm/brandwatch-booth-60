import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { IconActivity, IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import { format } from "date-fns";

interface HealthMetric {
  id: string;
  service_name: string;
  status: "healthy" | "degraded" | "down";
  response_time_ms: number;
  error_rate: number;
  created_at: string;
}

export const SystemHealthMonitor = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    const { data, error } = await supabase
      .from("system_health_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setMetrics(data as HealthMetric[]);

      // Prepare response time chart data
      const chartData = data
        .slice(0, 20)
        .reverse()
        .map((m) => ({
          time: format(new Date(m.created_at), "HH:mm"),
          api: m.service_name === "api" ? m.response_time_ms : null,
          db: m.service_name === "database" ? m.response_time_ms : null,
          functions: m.service_name === "edge_functions" ? m.response_time_ms : null,
        }));

      setResponseTimeData(chartData);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("system-health-monitor");
    if (!error) {
      await loadMetrics();
    }
    setLoading(false);
  };

  const getLatestMetric = (serviceName: string) => {
    return metrics.find((m) => m.service_name === serviceName);
  };

  const services = [
    { name: "api", label: "API Server" },
    { name: "database", label: "Database" },
    { name: "edge_functions", label: "Edge Functions" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconActivity className="h-5 w-5" />
                System Health Status
              </CardTitle>
              <CardDescription>Real-time monitoring of all services</CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={loading} variant="outline">
              <IconRefresh className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => {
              const metric = getLatestMetric(service.name);
              return (
                <Card key={service.name}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{service.label}</span>
                        <Badge
                          variant={
                            metric?.status === "healthy"
                              ? "default"
                              : metric?.status === "degraded"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {metric?.status || "unknown"}
                        </Badge>
                      </div>
                      {metric && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Response: {metric.response_time_ms}ms
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Error Rate: {(metric.error_rate * 100).toFixed(2)}%
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Time Trends</CardTitle>
          <CardDescription>Last 20 measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="api" stroke="#8884d8" name="API" />
              <Line type="monotone" dataKey="db" stroke="#82ca9d" name="Database" />
              <Line type="monotone" dataKey="functions" stroke="#ffc658" name="Functions" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertCircle className="h-5 w-5" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Error Rate</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics
                .filter((m) => m.status !== "healthy")
                .slice(0, 10)
                .map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">{metric.service_name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{metric.status}</Badge>
                    </TableCell>
                    <TableCell>{metric.response_time_ms}ms</TableCell>
                    <TableCell>{(metric.error_rate * 100).toFixed(2)}%</TableCell>
                    <TableCell>{format(new Date(metric.created_at), "PPP p")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
