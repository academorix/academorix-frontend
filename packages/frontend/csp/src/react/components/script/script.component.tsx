/**
 * @file script.component.tsx
 * @module @stackra/csp/react/components
 * @description Script — CSP-safe imperative script injection.
 *
 *   Replaces raw `document.createElement('script')` calls with a
 *   declarative React component that automatically injects the current
 *   nonce from `<NonceProvider>`. Renders nothing — the script is injected
 *   into `document.head`. Logic-only component — exempt from the HeroUI
 *   UI rule.
 */

import { useEffect, useRef, type ReactElement } from "react";

import { useNonce } from "@/react/hooks/use-nonce.hook";
import type { ScriptProps } from "@/react/interfaces/script-props.interface";

/**
 * CSP-safe script injection component. Automatically applies the current
 * nonce from `<NonceProvider>`.
 *
 * @example
 * ```tsx
 * <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX" />
 * <Script content="window.dataLayer = window.dataLayer || [];" />
 * ```
 *
 * @param props - Script configuration.
 * @returns `null` — the script is injected imperatively.
 */
export function Script({
  src,
  content,
  async: isAsync = true,
  defer = false,
  type = "text/javascript",
  id,
  onLoad,
  onError,
}: ScriptProps): ReactElement | null {
  const nonce = useNonce();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent double-injection in StrictMode.
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Dedup by ID.
    if (id && document.getElementById(id)) return;

    const script = document.createElement("script");
    script.type = type;

    if (nonce) {
      script.nonce = nonce;
    }

    if (id) {
      script.id = id;
    }

    if (src) {
      script.src = src;
      script.async = isAsync;
      script.defer = defer;

      if (onLoad) {
        script.addEventListener("load", onLoad);
      }

      if (onError) {
        script.addEventListener("error", onError);
      }
    } else if (content) {
      script.textContent = content;
    }

    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [src, content, nonce, isAsync, defer, type, id, onLoad, onError]);

  // Render nothing — the script is injected imperatively.
  return null;
}

Script.displayName = "Script";
