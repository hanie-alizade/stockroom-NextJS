import { TooltipWrapper } from "@/components/stockroom/tooltip";
import { toastSuccess, toastError } from "@/components/stockroom/toast";
import { Button } from "@/components/stockroom/button";

export function InteractiveShowcase(): React.ReactElement {
  return (
    <>
      <section>
        <h2 className="text-section text-text-primary mb-lg">Tooltip</h2>
        <div className="gap-md flex">
          <TooltipWrapper content="This is a tooltip">
            <Button variant="ghost">Hover me</Button>
          </TooltipWrapper>
          <TooltipWrapper content="Disabled action">
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </TooltipWrapper>
        </div>
      </section>

      <section>
        <h2 className="text-section text-text-primary mb-lg">Toast</h2>
        <div className="gap-md flex">
          <Button
            variant="primary"
            onClick={() =>
              toastSuccess({
                title: "Success!",
                description: "Your changes have been saved.",
              })
            }
          >
            Show Success Toast
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              toastError({
                title: "Error",
                description: "Something went wrong.",
              })
            }
          >
            Show Error Toast
          </Button>
        </div>
      </section>
    </>
  );
}
