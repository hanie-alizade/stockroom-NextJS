import type { ReactElement } from "react";
import type { IconProps } from "@/types";

export function PlusIcon(props: IconProps): ReactElement {
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
        d="M8.00001 3.33334V8M8.00001 8V12.6667M8.00001 8H3.33334M8.00001 8H12.6667"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
