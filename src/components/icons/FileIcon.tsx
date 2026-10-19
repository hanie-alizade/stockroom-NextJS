import type { ReactElement } from "react";
import type { IconProps } from "./types";

export function FileIcon(props: IconProps): ReactElement {
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
        d="M9.33334 2H4.00001C3.64639 2 3.30725 2.14048 3.0572 2.39052C2.80715 2.64057 2.66668 2.97971 2.66668 3.33333V12.6667C2.66668 13.0203 2.80715 13.3594 3.0572 13.6095C3.30725 13.8595 3.64639 14 4.00001 14H12C12.3536 14 12.6928 13.8595 12.9428 13.6095C13.1929 13.3594 13.3333 13.0203 13.3333 12.6667V6L9.33334 2Z"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M9.33334 2V6H13.3333"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
