import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Country data with flags and dial codes
const COUNTRIES = [
  { code: "ae", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "sa", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { code: "qa", name: "Qatar", flag: "🇶🇦", dialCode: "+974" },
  { code: "kw", name: "Kuwait", flag: "🇰🇼", dialCode: "+965" },
  { code: "bh", name: "Bahrain", flag: "🇧🇭", dialCode: "+973" },
  { code: "om", name: "Oman", flag: "🇴🇲", dialCode: "+968" },
  { code: "eg", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
  { code: "jo", name: "Jordan", flag: "🇯🇴", dialCode: "+962" },
  { code: "lb", name: "Lebanon", flag: "🇱🇧", dialCode: "+961" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "us", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "ca", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "in", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "pk", name: "Pakistan", flag: "🇵🇰", dialCode: "+92" },
  { code: "bd", name: "Bangladesh", flag: "🇧🇩", dialCode: "+880" },
  { code: "ph", name: "Philippines", flag: "🇵🇭", dialCode: "+63" },
  { code: "au", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "de", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "fr", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "es", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { code: "it", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱", dialCode: "+31" },
  { code: "ch", name: "Switzerland", flag: "🇨🇭", dialCode: "+41" },
  { code: "se", name: "Sweden", flag: "🇸🇪", dialCode: "+46" },
  { code: "no", name: "Norway", flag: "🇳🇴", dialCode: "+47" },
  { code: "sg", name: "Singapore", flag: "🇸🇬", dialCode: "+65" },
  { code: "my", name: "Malaysia", flag: "🇲🇾", dialCode: "+60" },
  { code: "th", name: "Thailand", flag: "🇹🇭", dialCode: "+66" },
  { code: "id", name: "Indonesia", flag: "🇮🇩", dialCode: "+62" },
  { code: "cn", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "jp", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
  { code: "kr", name: "South Korea", flag: "🇰🇷", dialCode: "+82" },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  isValid?: boolean;
  isDirty?: boolean;
  required?: boolean;
  disabled?: boolean;
  naLabel?: string;
  placeholder?: string;
  defaultCountry?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      value = "",
      onChange,
      error,
      isValid,
      isDirty,
      required,
      disabled,
      naLabel,
      placeholder = "50 123 4567",
      defaultCountry = "ae",
      ...props
    },
    ref
  ) => {
    // Parse existing value to extract country code and number
    const parsePhoneValue = (phoneValue: string) => {
      if (!phoneValue) return { countryCode: defaultCountry, number: "" };

      const cleaned = phoneValue.replace(/[\s\-()]/g, "");
      
      // Try to match against known dial codes
      for (const country of COUNTRIES) {
        if (cleaned.startsWith(country.dialCode)) {
          return {
            countryCode: country.code,
            number: cleaned.substring(country.dialCode.length),
          };
        }
      }

      // Default to UAE if no match
      return { countryCode: defaultCountry, number: phoneValue };
    };

    const { countryCode: initialCountryCode, number: initialNumber } = parsePhoneValue(value);
    const [selectedCountry, setSelectedCountry] = React.useState(initialCountryCode);
    const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);

    // Update when value prop changes externally
    React.useEffect(() => {
      const { countryCode: newCountryCode, number: newNumber } = parsePhoneValue(value);
      setSelectedCountry(newCountryCode);
      setPhoneNumber(newNumber);
    }, [value]);

    const selectedCountryData = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

    const handleCountryChange = (newCountryCode: string) => {
      setSelectedCountry(newCountryCode);
      const newCountryData = COUNTRIES.find((c) => c.code === newCountryCode);
      if (newCountryData && phoneNumber) {
        // Combine new dial code with existing number
        onChange(`${newCountryData.dialCode}${phoneNumber}`);
      }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value.replace(/[^\d]/g, ""); // Only digits
      setPhoneNumber(newNumber);
      
      if (newNumber) {
        onChange(`${selectedCountryData.dialCode}${newNumber}`);
      } else {
        onChange("");
      }
    };

    const hasError = !disabled && isDirty && error;
    const showSuccess = !disabled && isDirty && isValid && !error;

    if (disabled && naLabel) {
      return (
        <div className="space-y-2">
          <Label className="text-muted-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
            {naLabel}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(hasError && "text-destructive", disabled && "text-muted-foreground")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
            {hasError && (
              <span className="ml-2 text-xs font-normal text-destructive inline-flex items-center gap-1">
                <IconAlertCircle className="h-3 w-3" />
                {error}
              </span>
            )}
            {showSuccess && (
              <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                <IconCheck className="h-3 w-3" />
                Valid
              </span>
            )}
          </Label>
        )}
        <div className="flex gap-2">
          {/* Country Selector */}
          <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
            <SelectTrigger className={cn("w-[140px]", hasError && "border-destructive focus:ring-destructive")}>
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{selectedCountryData.flag}</span>
                  <span className="text-sm">{selectedCountryData.dialCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm">{country.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">{country.dialCode}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Phone Number Input */}
          <div className="relative flex-1">
            <Input
              ref={ref}
              type="tel"
              value={phoneNumber}
              onChange={handleNumberChange}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                hasError && "border-destructive focus-visible:ring-destructive",
                showSuccess && "border-green-600 focus-visible:ring-green-600",
                disabled && "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              {...props}
            />
            {showSuccess && (
              <IconCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600 dark:text-green-400" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
