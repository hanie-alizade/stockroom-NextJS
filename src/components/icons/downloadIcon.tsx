import type { ReactElement } from "react";
import type { IconProps } from "@/lib/types/common";

export function DownloadIcon(props: IconProps): ReactElement {
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
        d="M8.00002 2.66666V10M11.3334 6.66666L8.00002 10L4.66669 6.66666M2.66669 10V12.6667C2.66669 12.8435 2.73693 13.013 2.86195 13.1381C2.98697 13.2631 3.15654 13.3333 3.33335 13.3333H12.6667C12.8435 13.3333 13.0131 13.2631 13.1381 13.1381C13.2631 13.013 13.3334 12.8435 13.3334 12.6667V10"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
