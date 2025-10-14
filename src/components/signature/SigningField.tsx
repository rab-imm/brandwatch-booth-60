import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Calendar, FileText, CheckSquare } from "lucide-react";
import { SignatureCanvas } from "./SignatureCanvas";
import { uploadSignatureImage } from "@/lib/signature-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SigningFieldProps {
  field: {
    id: string;
    field_type: string;
    recipient_id?: string;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    field_label?: string;
    placeholder_text?: string;
    is_required: boolean;
  };
  value?: string;
  onComplete: (fieldId: string, value: string) => void;
}

export const SigningField = ({ field, value, onComplete }: SigningFieldProps) => {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [localValue, setLocalValue] = useState<string>(value || "");

  const handleSignatureSave = async (signature: string) => {
    try {
      // Upload signature image and get URL
      const signatureUrl = await uploadSignatureImage(
        signature,
        field.recipient_id || 'unknown',
        field.id
      );
      
      // Save URL instead of base64 data
      setLocalValue(signatureUrl);
      onComplete(field.id, signatureUrl);
      setShowSignatureDialog(false);
    } catch (error) {
      console.error('Failed to upload signature:', error);
      // Fallback to base64 if upload fails
      setLocalValue(signature);
      onComplete(field.id, signature);
      setShowSignatureDialog(false);
    }
  };

  const handleTextChange = (newValue: string) => {
    setLocalValue(newValue);
    onComplete(field.id, newValue);
  };

  const handleCheckboxChange = (checked: boolean) => {
    const stringValue = checked ? "true" : "false";
    setLocalValue(stringValue);
    onComplete(field.id, stringValue);
  };

  const getFieldIcon = () => {
    switch (field.field_type) {
      case "signature":
      case "initial":
        return <Pencil className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "checkbox":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getFieldColor = () => {
    switch (field.field_type) {
      case "signature":
        return "border-blue-500 bg-blue-50";
      case "initial":
        return "border-purple-500 bg-purple-50";
      case "date":
        return "border-green-500 bg-green-50";
      case "text":
        return "border-orange-500 bg-orange-50";
      case "checkbox":
        return "border-pink-500 bg-pink-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const renderFieldContent = () => {
    const hasValue = field.field_type === "checkbox" ? localValue : Boolean(localValue);

    if (field.field_type === "signature" || field.field_type === "initial") {
      return (
        <>
          {hasValue && typeof localValue === "string" ? (
            <img src={localValue} alt="Signature" className="w-full h-full object-contain" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-full"
              onClick={() => setShowSignatureDialog(true)}
            >
              {getFieldIcon()}
              <span className="ml-2 text-xs">
                {field.field_type === "signature" ? "Sign" : "Initial"}
              </span>
            </Button>
          )}

          <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {field.field_type === "signature" ? "Add Signature" : "Add Initial"}
                </DialogTitle>
                <DialogDescription>
                  {field.field_label || `Draw your ${field.field_type}`}
                </DialogDescription>
              </DialogHeader>
              <SignatureCanvas
                onSave={handleSignatureSave}
                onCancel={() => setShowSignatureDialog(false)}
                label={field.field_label}
              />
            </DialogContent>
          </Dialog>
        </>
      );
    }

    if (field.field_type === "date") {
      return (
        <Input
          type="date"
          value={typeof localValue === "string" ? localValue : ""}
          onChange={(e) => handleTextChange(e.target.value)}
          className="h-full border-0 bg-transparent"
          placeholder={field.placeholder_text}
        />
      );
    }

    if (field.field_type === "text") {
      return (
        <Input
          type="text"
          value={typeof localValue === "string" ? localValue : ""}
          onChange={(e) => handleTextChange(e.target.value)}
          className="h-full border-0 bg-transparent"
          placeholder={field.placeholder_text || "Enter text"}
        />
      );
    }

    if (field.field_type === "checkbox") {
      return (
        <div className="flex items-center justify-center h-full">
          <Checkbox
            checked={localValue === "true"}
            onCheckedChange={handleCheckboxChange}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`absolute border-2 ${getFieldColor()} ${
        localValue ? "opacity-100" : "opacity-70 hover:opacity-100"
      } transition-opacity`}
      style={{
        left: `${field.x_position}%`,
        top: `${field.y_position}%`,
        width: `${field.width}px`,
        height: `${field.height}px`,
      }}
    >
      {renderFieldContent()}
      {field.is_required && !localValue && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
          *
        </div>
      )}
    </div>
  );
};
