import { Button } from "@/components/stockroom/button";
import { SearchIcon, ChevronDownIcon } from "@/components/icons";

export function ButtonShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Buttons</h2>
      <div className="gap-md flex flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" isLoading>
          Loading
        </Button>
        <Button variant="primary" leadingIcon={<SearchIcon />} trailingIcon={<ChevronDownIcon />}>
          With Icons
        </Button>
        <Button variant="ghost" iconOnly accessibleName="Search">
          <SearchIcon />
        </Button>
      </div>
    </section>
  );
}
