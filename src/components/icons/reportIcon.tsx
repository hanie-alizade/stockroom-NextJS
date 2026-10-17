import type { ReactElement } from "react";
import type { IconProps } from "@/lib/types/common";

export function ReportIcon(props: IconProps): ReactElement {
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
        d="M9.33333 2H4C3.82319 2 3.65362 2.07024 3.5286 2.19526C3.40357 2.32029 3.33333 2.48986 3.33333 2.66667V13.3333C3.33333 13.5101 3.40357 13.6797 3.5286 13.8047C3.65362 13.9298 3.82319 14 4 14H12C12.1768 14 12.3464 13.9298 12.4714 13.8047C12.5964 13.6797 12.6667 13.5101 12.6667 13.3333V5.33333L9.33333 2Z"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M9.33333 2V5.33333H12.6667"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
