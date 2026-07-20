/**
 * @file theme-script.component.tsx
 * @module @stackra/theming/react/components
 * @description SSR blocking script that reads localStorage for mode and theme,
 *   applies correct classes before React hydrates to prevent FOUC.
 */

import type { ReactElement } from "react";
import type { ColorMode } from "@stackra/contracts";
import {
  DEFAULT_MODE_STORAGE_KEY,
  DEFAULT_THEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_DATA_ATTRIBUTE,
} from "../../../core/constants";

// ============================================================================
// Props
// ============================================================================

/** Props for the SSR-safe `<ThemeScript />` blocking helper. */
export interface ThemeScriptProps {
  /** localStorage key for the color mode. Defaults to the module default. */
  readonly storageKey?: string;
  /** localStorage key for the active theme id. Defaults to the module default. */
  readonly themeKey?: string;
  /** Default mode when nothing is persisted. @default 'system' */
  readonly defaultMode?: ColorMode;
  /** CSP nonce forwarded onto the emitted `<script>`. */
  readonly nonce?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SSR blocking `<script>` that reads localStorage for mode AND theme,
 * applies correct class + data-design-theme before hydration.
 *
 * Place this in your `<head>` or at the top of `<body>` to prevent
 * flash of wrong theme.
 *
 * @param props - Configuration props.
 * @returns A script element with blocking behavior.
 */
export function ThemeScript({
  storageKey = DEFAULT_MODE_STORAGE_KEY,
  themeKey = DEFAULT_THEME_STORAGE_KEY,
  defaultMode = "system",
  nonce,
}: ThemeScriptProps = {}): ReactElement {
  const script = `(function(){try{var d=document.documentElement;var m=localStorage.getItem('${storageKey}')||'${defaultMode}';var t=localStorage.getItem('${themeKey}');var r=m;if(m==='system'){r=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}d.classList.add(r);d.setAttribute('data-theme',r);d.style.colorScheme=r;if(t&&t!=='${DEFAULT_THEME_ID}'){d.setAttribute('${THEME_DATA_ATTRIBUTE}',t);}}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      nonce={nonce}
      // eslint-disable-next-line react/no-unknown-property
      suppressHydrationWarning
    />
  );
}
