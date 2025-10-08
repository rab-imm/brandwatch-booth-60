import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { IconCash, IconChartLine, IconDownload } from "@tabler/icons-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface RevenueShare {
  id: string;
  sale_amount_aed: number;
  creator_share_aed: number;
  platform_share_aed: number;
  created_at: string;
  status: string;
  template_id: string;
}

export const CreatorRevenueDashboard = () => {
  const { profile } = useAuth();
  const [revenues, setRevenues] = useState<RevenueShare[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [paidEarnings, setPaidEarnings] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRevenues();
  }, [profile]);

  const loadRevenues = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("revenue_shares")
      .select("*")
      .eq("creator_user_id", profile.user_id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRevenues(data);
      const total = data.reduce((sum, r) => sum + Number(r.creator_share_aed), 0);
      const pending = data
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + Number(r.creator_share_aed), 0);
      const paid = data
        .filter((r) => r.status === "paid")
        .reduce((sum, r) => sum + Number(r.creator_share_aed), 0);

      setTotalEarnings(total);
      setPendingEarnings(pending);
      setPaidEarnings(paid);
    }
  };

  const handleRequestPayout = async () => {
    if (pendingEarnings < 100) {
      toast.error("Minimum payout amount is AED 100");
      return;
    }

    setLoading(true);
    const { error } = await supabase.functions.invoke("process-creator-payouts", {
      body: { creator_id: profile?.user_id },
    });

    if (error) {
      toast.error("Failed to request payout");
    } else {
      toast.success("Payout request submitted");
      loadRevenues();
    }
    setLoading(false);
  };

  const chartData = revenues
    .slice(0, 30)
    .reverse()
    .map((r) => ({
      date: format(new Date(r.created_at), "MMM dd"),
      earnings: Number(r.creator_share_aed),
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IconCash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <IconChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              AED {pendingEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <IconDownload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              AED {paidEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Earnings Over Time</CardTitle>
              <CardDescription>Last 30 sales</CardDescription>
            </div>
            <Button
              onClick={handleRequestPayout}
              disabled={loading || pendingEarnings < 100}
            >
              Request Payout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Recent revenue shares</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Your Share</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.slice(0, 10).map((revenue) => (
                <TableRow key={revenue.id}>
                  <TableCell>
                    {format(new Date(revenue.created_at), "PPP")}
                  </TableCell>
                  <TableCell>AED {Number(revenue.sale_amount_aed).toFixed(2)}</TableCell>
                  <TableCell className="font-medium">
                    AED {Number(revenue.creator_share_aed).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={revenue.status === "paid" ? "default" : "secondary"}
                    >
                      {revenue.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
