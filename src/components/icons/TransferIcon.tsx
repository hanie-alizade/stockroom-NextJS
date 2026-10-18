import type { ReactElement } from "react";
import type { IconProps } from "@/types";

// TODO(hanie): replace the path with the Figma export
export function TransferIcon(props: IconProps): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        d="M2.5 5.5H13.5M13.5 5.5L10.5 2.5M13.5 5.5L10.5 8.5M13.5 10.5H2.5M2.5 10.5L5.5 7.5M2.5 10.5L5.5 13.5"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
