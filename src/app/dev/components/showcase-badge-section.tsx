import { StatusBadge } from "@/components/stockroom/status-badge";
import { MovementTypePill } from "@/components/stockroom/movement-type-pill";

export function BadgeShowcase(): React.ReactElement {
  return (
    <>
      <section>
        <h2 className="text-section text-text-primary mb-lg">Status Badges</h2>
        <div className="gap-md flex flex-wrap">
          <StatusBadge variant="in-stock" />
          <StatusBadge variant="low" />
          <StatusBadge variant="out-of-stock" />
        </div>
      </section>

      <section>
        <h2 className="text-section text-text-primary mb-lg">Movement Type Pills</h2>
        <div className="gap-md flex flex-wrap">
          <MovementTypePill type="receive" />
          <MovementTypePill type="sell" />
          <MovementTypePill type="write_off" />
          <MovementTypePill type="transfer_in" />
          <MovementTypePill type="transfer_out" />
          <MovementTypePill type="import" />
        </div>
      </section>
    </>
  );
}
