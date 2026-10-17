import type { ReactElement } from "react";
import type { IconProps } from "@/types/common";

export function BoxIcon(props: IconProps): ReactElement {
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
        d="M2 4.66667L8 2L14 4.66667V11.3333L8 14L2 11.3333V4.66667Z"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke="currentColor"
      />
      <path
        d="M2 4.66667L8 7.33334M8 7.33334L14 4.66667M8 7.33334V14"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
