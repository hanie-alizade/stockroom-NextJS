import { Select } from "@/components/stockroom/select";
import { StoreIcon } from "@/components/icons";
import { useState } from "react";

export function SelectShowcase(): React.ReactElement {
  const [selectValue, setSelectValue] = useState("");

  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Select</h2>
      <div className="space-y-md max-w-md">
        <Select
          options={[
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
            { value: "3", label: "Option 3" },
          ]}
          value={selectValue}
          onValueChange={setSelectValue}
          placeholder="Choose an option"
        />
        <Select
          options={[
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
            { value: "3", label: "Option 3", disabled: true },
          ]}
          placeholder="With disabled option"
          leadingIcon={<StoreIcon />}
        />
        <Select
          options={[
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
          ]}
          placeholder="Disabled"
          disabled
        />
      </div>
    </section>
  );
}
