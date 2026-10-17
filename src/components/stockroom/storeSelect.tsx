import { Select } from "./select";
import { InfoIcon } from "@/components/icons";

interface StoreSelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function StoreSelect({
  options,
  value,
  onValueChange,
  disabled,
}: StoreSelectProps): React.ReactElement {
  return (
    <Select
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder="Select store"
      // TODO: icon
      leadingIcon={<InfoIcon className="h-4 w-4" />}
      disabled={disabled}
    />
  );
}
