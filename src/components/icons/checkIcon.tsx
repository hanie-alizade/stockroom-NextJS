import type { ReactElement } from "react";
import type { IconProps } from "@/types";

export function CheckIcon(props: IconProps): ReactElement {
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
        d="M3.33334 8.33333L6.33334 11.3333L12.6667 5"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
