import type { SVGProps } from "react";

export function UploadIcon(props: SVGProps<SVGSVGElement>): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.99999 10V2.66666M11.3333 6L7.99999 2.66666L4.66666 6M2.66666 10V12.6667C2.66666 12.8435 2.73689 13.013 2.86192 13.1381C2.98694 13.2631 3.15651 13.3333 3.33332 13.3333H12.6667C12.8435 13.3333 13.013 13.2631 13.1381 13.1381C13.2631 13.013 13.3333 12.8435 13.3333 12.6667V10"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
