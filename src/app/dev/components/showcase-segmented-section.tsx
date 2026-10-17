import { SegmentedControl } from "@/components/stockroom/segmented-control";
import { useState } from "react";

export function SegmentedControlShowcase(): React.ReactElement {
  const [segmentedValue, setSegmentedValue] = useState("option1");

  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Segmented Control</h2>
      <div className="space-y-md max-w-md">
        <SegmentedControl
          segments={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
          ]}
          value={segmentedValue}
          onValueChange={setSegmentedValue}
        />
        <SegmentedControl
          segments={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2", locked: true, lockedReason: "Not available" },
            { value: "option3", label: "Option 3" },
          ]}
          value={segmentedValue}
          onValueChange={setSegmentedValue}
        />
        <SegmentedControl
          segments={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
          ]}
          value={segmentedValue}
          onValueChange={setSegmentedValue}
          disabled
        />
      </div>
    </section>
  );
}
