import { cn } from "@/lib/utils";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { CheckIcon, MinusIcon } from "@/components/icons";
import type { CheckboxProps as ShadcnCheckboxProps } from "@radix-ui/react-checkbox";

interface CheckboxProps extends Omit<ShadcnCheckboxProps, "asChild"> {
  label?: string;
}

export function Checkbox({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: CheckboxProps): React.ReactElement {
  return (
    <div className="gap-sm flex items-center">
      <ShadcnCheckbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "border-border-default focus-ring rounded-sm",
          checked === "indeterminate" && "data-[state=checked]:bg-accent-default",
          className,
        )}
        {...props}
      >
        {checked === true && <CheckIcon className="text-text-on-accent h-4 w-4" />}
        {checked === "indeterminate" && <MinusIcon className="text-text-on-accent h-4 w-4" />}
      </ShadcnCheckbox>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "text-body text-text-primary cursor-pointer",
            disabled && "text-text-disabled cursor-not-allowed",
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
