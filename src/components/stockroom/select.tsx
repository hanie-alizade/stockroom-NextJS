import { cn } from "@/lib/utils";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/icons";
import type { ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  leadingIcon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  leadingIcon,
  disabled,
  className,
}: SelectProps): React.ReactElement {
  return (
    <ShadcnSelect value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("focus-ring", leadingIcon && "pl-xl", className)}>
        {leadingIcon && <span className="left-md text-text-tertiary absolute">{leadingIcon}</span>}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
}
