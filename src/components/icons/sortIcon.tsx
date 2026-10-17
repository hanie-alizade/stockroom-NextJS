import type { ReactElement } from "react";
import type { IconProps } from "@/types/common";

export function SortIcon(props: IconProps): ReactElement {
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
        d="M5.33333 6L7.99999 3.33334L10.6667 6M5.33333 10L7.99999 12.6667L10.6667 10"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
