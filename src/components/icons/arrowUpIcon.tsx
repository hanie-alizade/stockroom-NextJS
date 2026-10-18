import type { ReactElement } from "react";
import type { IconProps } from "@/types";

export function ArrowUpIcon(props: IconProps): ReactElement {
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
        d="M8 12.6667V3.33334M12 7.33334L8 3.33334L4 7.33334"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
