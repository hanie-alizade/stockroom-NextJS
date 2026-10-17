import { InlineAlert } from "@/components/stockroom/inline-alert";

export function AlertShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Inline Alerts</h2>
      <div className="space-y-md max-w-2xl">
        <InlineAlert variant="error" title="Error occurred">
          Something went wrong while processing your request.
        </InlineAlert>
        <InlineAlert variant="warning" title="Warning">
          This action cannot be undone. Please proceed with caution.
        </InlineAlert>
        <InlineAlert variant="info" title="Information">
          Your changes have been saved successfully.
        </InlineAlert>
        <InlineAlert
          variant="error"
          title="Connection failed"
          actionLabel="Try again"
          onAction={() => {}}
        >
          Unable to connect to the server. Check your network connection.
        </InlineAlert>
      </div>
    </section>
  );
}
