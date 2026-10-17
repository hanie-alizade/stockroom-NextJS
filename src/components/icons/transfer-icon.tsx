// TODO: Figma SVG not supplied - transfer arrows for MovementTypePill
import type { SVGProps } from "react";

export function TransferIcon(props: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <text x="0" y="12" fontSize="12" fill="currentColor">
        ⇄
      </text>
    </svg>
  );
}
