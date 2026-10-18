import type { ReactElement } from "react";
import type { IconProps } from "./types";

export function SupplierIcon(props: IconProps): ReactElement {
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
        d="M2.66667 6.66667V12.6667H13.3333V6.66667"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M2 5.33334L3 2.66667H13L14 5.33334C14 5.86377 13.7893 6.37248 13.4142 6.74755C13.0391 7.12263 12.5304 7.33334 12 7.33334C11.4696 7.33334 10.9609 7.12263 10.5858 6.74755C10.2107 6.37248 10 5.86377 10 5.33334C10 5.86377 9.78929 6.37248 9.41421 6.74755C9.03914 7.12263 8.53043 7.33334 8 7.33334C7.46957 7.33334 6.96086 7.12263 6.58579 6.74755C6.21071 6.37248 6 5.86377 6 5.33334C6 5.86377 5.78929 6.37248 5.41421 6.74755C5.03914 7.12263 4.53043 7.33334 4 7.33334C3.46957 7.33334 2.96086 7.12263 2.58579 6.74755C2.21071 6.37248 2 5.86377 2 5.33334Z"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}
