import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Calendar, FileText, CheckSquare, X } from "lucide-react";

export type FieldType = "signature" | "initial" | "date" | "text" | "checkbox";

export interface SignatureField {
  id: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  recipientEmail: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

interface SignatureFieldPlacerProps {
  fields: SignatureField[];
  currentRecipient?: string;
  selectedFieldType?: FieldType;
  onFieldTypeChange?: (type: FieldType) => void;
  onAddField: (field: Omit<SignatureField, "id">) => void;
  onRemoveField: (fieldId: string) => void;
}

const fieldTypes: { type: FieldType; label: string; icon: any; color: string }[] = [
  { type: "signature", label: "Signature", icon: Pencil, color: "bg-blue-500" },
  { type: "initial", label: "Initial", icon: Pencil, color: "bg-purple-500" },
  { type: "date", label: "Date", icon: Calendar, color: "bg-green-500" },
  { type: "text", label: "Text", icon: FileText, color: "bg-orange-500" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, color: "bg-pink-500" },
];

export const SignatureFieldPlacer = ({
  fields,
  currentRecipient,
  selectedFieldType: externalSelectedFieldType,
  onFieldTypeChange,
  onAddField,
  onRemoveField,
}: SignatureFieldPlacerProps) => {
  const [internalSelectedFieldType, setInternalSelectedFieldType] = useState<FieldType>("signature");
  
  const selectedFieldType = externalSelectedFieldType ?? internalSelectedFieldType;

  const handleFieldTypeClick = (type: FieldType) => {
    if (onFieldTypeChange) {
      onFieldTypeChange(type);
    } else {
      setInternalSelectedFieldType(type);
    }
  };

  const recipientFields = currentRecipient
    ? fields.filter((f) => f.recipientEmail === currentRecipient)
    : fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Select a field type, then click on the document to place it
          </p>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.map(({ type, label, icon: Icon, color }) => (
              <Button
                key={type}
                variant={selectedFieldType === type ? "default" : "outline"}
                size="sm"
                onClick={() => handleFieldTypeClick(type)}
                className="justify-start"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {currentRecipient && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Current Recipient: {currentRecipient}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Placed Fields ({recipientFields.length})</p>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recipientFields.map((field) => {
              const fieldConfig = fieldTypes.find((ft) => ft.type === field.type);
              const Icon = fieldConfig?.icon;
              
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    <div>
                      <p className="text-sm font-medium">{fieldConfig?.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Page {field.page} • {field.recipientEmail}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveField(field.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {recipientFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fields placed yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
