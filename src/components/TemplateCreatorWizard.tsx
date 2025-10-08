import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { IconChevronLeft, IconChevronRight, IconCheck } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

const STEPS = ["Template Info", "Content Editor", "Preview", "Publish"];

export const TemplateCreatorWizard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content: "",
    isDraft: true,
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async (asDraft: boolean) => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("letter_templates").insert({
      title: formData.title,
      description: formData.description,
      letter_type: formData.category as Database["public"]["Enums"]["letter_type"],
      template_content: formData.content,
      is_active: !asDraft,
      created_by: profile?.user_id,
    });

    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success(asDraft ? "Template saved as draft" : "Template published");
      navigate("/creator-portal");
    }
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Employment Contract Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this template..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter your template content here. Use {{field_name}} for merge fields..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Merge Fields Help:</p>
              <p className="text-muted-foreground">
                Use double curly braces for merge fields: {`{{party_name}}, {{date}}, {{amount}}`}
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">{formData.title}</h3>
              {formData.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {formData.description}
                </p>
              )}
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {formData.content}
                </pre>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <IconCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Ready to Publish</h3>
                <p className="text-muted-foreground">
                  Your template is ready. You can publish it now or save as draft.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handlePublish(true)}
                variant="outline"
                disabled={loading}
              >
                Save as Draft
              </Button>
              <Button onClick={() => handlePublish(false)} disabled={loading}>
                Publish Template
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </CardDescription>
          <Progress value={((currentStep + 1) / STEPS.length) * 100} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {currentStep < STEPS.length - 1 && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <IconChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext}>
                Next
                <IconChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
