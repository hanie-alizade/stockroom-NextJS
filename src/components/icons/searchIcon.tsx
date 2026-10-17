import type { ReactElement } from "react";
import type { IconProps } from "@/types/common";

export function SearchIcon(props: IconProps): ReactElement {
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
        d="M12 7.33333C12 9.91066 9.91066 12 7.33333 12C4.75601 12 2.66667 9.91066 2.66667 7.33333C2.66667 4.756 4.75601 2.66666 7.33333 2.66666C9.91066 2.66666 12 4.756 12 7.33333Z"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M13.3333 13.3333L11 11"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
