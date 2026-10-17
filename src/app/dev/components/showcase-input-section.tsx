import { Input } from "@/components/stockroom/input";
import { SearchIcon } from "@/components/icons";

export function InputShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Inputs</h2>
      <div className="space-y-md max-w-md">
        <Input label="Default" placeholder="Enter text" />
        <Input label="With icon" leadingIcon={<SearchIcon />} placeholder="Search..." />
        <Input label="Error state" error="This field is required" placeholder="Enter value" />
        <Input label="Disabled" disabled placeholder="Cannot edit" />
      </div>
    </section>
  );
}
