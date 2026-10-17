import { Checkbox } from "@/components/stockroom/checkbox";

export function CheckboxShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Checkbox</h2>
      <div className="space-y-md">
        <Checkbox label="Unchecked" checked={false} onCheckedChange={() => {}} />
        <Checkbox label="Checked" checked={true} onCheckedChange={() => {}} />
        <Checkbox label="Indeterminate" checked="indeterminate" onCheckedChange={() => {}} />
        <Checkbox label="Disabled" checked={false} onCheckedChange={() => {}} disabled />
      </div>
    </section>
  );
}
