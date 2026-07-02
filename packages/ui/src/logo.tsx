import type { SVGProps } from "react";

export interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Academorix wordmark glyph. Inherits color via `currentColor`. */
export function Logo({ size = 32, height, width, ...props }: LogoProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size ?? height}
      role="presentation"
      viewBox="0 0 32 32"
      width={size ?? width}
      {...props}
    >
      <path
        d="M16 3 3 28h6.4l2.3-4.6h8.6L22.6 28H29L16 3Zm-2.3 15.1L16 12.9l2.3 5.2h-4.6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
