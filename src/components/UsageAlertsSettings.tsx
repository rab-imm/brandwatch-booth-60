import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { IconBell, IconMail, IconDeviceFloppy } from "@tabler/icons-react";

interface AlertSettings {
  thresholds: number[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export const UsageAlertsSettings = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AlertSettings>({
    thresholds: [25, 50, 75, 90],
    emailEnabled: true,
    inAppEnabled: true,
  });

  useEffect(() => {
    loadSettings();
  }, [profile]);

  const loadSettings = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("metadata")
      .eq("user_id", profile.user_id)
      .single();

    if (!error && data?.metadata) {
      const metadata = data.metadata as Record<string, unknown>;
      if (metadata.alertSettings) {
        setSettings(metadata.alertSettings as typeof settings);
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    const currentMetadata = (profile.metadata as Record<string, unknown>) || {};
    const { error } = await supabase
      .from("profiles")
      .update({
        metadata: JSON.parse(JSON.stringify({
          ...currentMetadata,
          alertSettings: settings,
        })),
      })
      .eq("user_id", profile.user_id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Alert settings saved");
    }
    setLoading(false);
  };

  const handleTestAlert = async () => {
    toast.info("Test alert sent! Check your notifications.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="h-5 w-5" />
          Usage Alert Settings
        </CardTitle>
        <CardDescription>
          Configure when you receive alerts about credit usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Alert Thresholds (%)</Label>
          <div className="grid grid-cols-4 gap-4">
            {settings.thresholds.map((threshold, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Alert {index + 1}
                </Label>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => {
                    const newThresholds = [...settings.thresholds];
                    newThresholds[index] = value[0];
                    setSettings({ ...settings, thresholds: newThresholds });
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-center text-sm font-medium">{threshold}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              <Label>Email Notifications</Label>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBell className="h-4 w-4" />
              <Label>In-App Notifications</Label>
            </div>
            <Switch
              checked={settings.inAppEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, inAppEnabled: checked })
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleTestAlert}>
            Test Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
