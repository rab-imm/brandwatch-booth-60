import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ValidatedDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string | null;
  isDirty?: boolean;
  required?: boolean;
}

export function ValidatedDatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  error,
  isDirty = false,
  required = false,
}: ValidatedDatePickerProps) {
  const selectedDate = value ? new Date(value) : undefined;
  const hasError = error && isDirty;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date.toISOString());
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className={cn(hasError && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {hasError && <AlertCircle className="inline h-3 w-3 ml-1" />}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground",
              hasError && "border-destructive focus-visible:ring-destructive animate-shake"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-in fade-in-50">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
