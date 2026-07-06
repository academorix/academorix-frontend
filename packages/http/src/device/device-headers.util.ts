/**
 * @file device-headers.util.ts
 * @module @academorix/http/device/device-headers.util
 *
 * @description
 * Derives the `X-Device-*`, `X-Client`, `X-Timezone`, and `X-Locale`
 * headers the backend uses for session records + audit trails.
 *
 * ### `X-Device-Id`
 *
 * A stable UUID persisted in `localStorage` so the same browser
 * reports the same device across sessions (matching how a native app
 * would identify a device install). If storage is unavailable
 * (private mode, tests) we mint a per-session UUID instead — the
 * header is still sent so the backend can correlate a single load.
 *
 * ## Cross-runtime
 *
 * All browser globals (`navigator`, `window`, `document`, `Intl`,
 * `crypto`) are guarded so this module is safe to import from Server
 * Components / Node scripts. Server-side calls produce sensible
 * defaults (`"Unknown"` / `"UTC"` / a fresh UUID that isn't
 * persisted).
 */

import { getDeviceLocale } from "./locale.util";

/** `localStorage` key under which the device UUID is persisted. */
const DEFAULT_DEVICE_ID_KEY = "academorix.device.id";

/** Options accepted by {@link createDeviceHeadersReader}. */
export interface DeviceHeadersOptions {
  /**
   * Client version string emitted in the `X-Client` header. Defaults
   * to `"academorix-web/dev"`. Apps pass their build's version here
   * (Vite: `__ACADEMORIX_VERSION__`; Next.js: `process.env.npm_package_version`).
   */
  readonly clientVersion?: string;

  /**
   * Product identifier prefixed to the client version.
   * `"academorix-web"` → `"academorix-web/1.2.3"`. Change to
   * `"academorix-marketing"` etc. per app.
   */
  readonly clientName?: string;

  /**
   * `localStorage` key for the persistent device UUID.
   * Defaults to `"academorix.device.id"`.
   */
  readonly deviceIdStorageKey?: string;

  /**
   * Read the active UI locale. Defaults to reading `<html lang>` and
   * falling back to `navigator.language`. Apps can pass a closure
   * bound to their `useLocale()` hook if they want to override.
   */
  readonly readLocale?: () => string;
}

/** Generates a UUIDv4 string using Web Crypto when available. */
function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // RFC 4122 v4-ish fallback.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === "x" ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}

/** Reads (or mints) the persistent device UUID. */
function getDeviceId(storageKey: string): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(storageKey);

      if (stored) {
        return stored;
      }

      const fresh = generateUuid();

      window.localStorage.setItem(storageKey, fresh);

      return fresh;
    }
  } catch {
    // Fall through to session-scoped id.
  }

  return generateUuid();
}

/**
 * Best-effort browser + OS detection. Prefers `userAgentData`
 * (Chromium) and falls back to `userAgent` string sniffing. Returns
 * strings safe to send as headers (no PII, no user-supplied content).
 */
function detectBrowserAndOs(): { browser: string; os: string; platform: string } {
  if (typeof navigator === "undefined") {
    return { browser: "Unknown", os: "Unknown", platform: "Unknown" };
  }

  const uaData = (
    navigator as Navigator & {
      userAgentData?: {
        brands: { brand: string; version: string }[];
        platform: string;
        mobile: boolean;
      };
    }
  ).userAgentData;

  if (uaData) {
    const brand =
      uaData.brands.find((entry) => !/Brand|Chromium/i.test(entry.brand))?.brand ??
      uaData.brands[0]?.brand ??
      "Unknown";

    return {
      browser: brand,
      os: uaData.platform || "Unknown",
      platform: uaData.mobile ? "mobile" : "desktop",
    };
  }

  const ua = navigator.userAgent ?? "";
  let browser = "Unknown";

  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  let os = "Unknown";

  if (/Windows NT 10/.test(ua)) os = "Windows 10";
  else if (/Windows NT 11/.test(ua)) os = "Windows 11";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X ([\d._]+)/.test(ua)) os = `macOS ${RegExp.$1.replace(/_/g, ".")}`;
  else if (/Android ([\d.]+)/.test(ua)) os = `Android ${RegExp.$1}`;
  else if (/iPhone OS ([\d_]+)/.test(ua)) os = `iOS ${RegExp.$1.replace(/_/g, ".")}`;
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os, platform: os };
}

/** Returns `desktop | mobile | tablet` based on UA hints + screen width. */
function detectDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof navigator === "undefined") {
    return "desktop";
  }

  const uaData = (navigator as Navigator & { userAgentData?: { mobile: boolean } }).userAgentData;

  if (uaData?.mobile) {
    if (typeof window !== "undefined" && window.innerWidth >= 600 && window.innerWidth <= 1200) {
      return "tablet";
    }

    return "mobile";
  }

  const ua = navigator.userAgent ?? "";

  if (/Tablet|iPad/.test(ua)) {
    return "tablet";
  }

  if (/Mobi|Android|iPhone|iPod/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

/** Best-effort IANA timezone (falls back to `"UTC"`). */
function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Builds a device-headers reader. The heavy detection runs once at
 * first call; subsequent calls only re-read the locale (which changes
 * at runtime when the user switches language).
 *
 * @param options - Client version + product name + optional overrides.
 * @returns A `() => Record<string, string>` reader safe to call
 *   before every request.
 */
export function createDeviceHeadersReader(
  options: DeviceHeadersOptions = {},
): () => Record<string, string> {
  const clientName = options.clientName ?? "academorix-web";
  const clientVersion = options.clientVersion ?? "dev";
  const storageKey = options.deviceIdStorageKey ?? DEFAULT_DEVICE_ID_KEY;
  const readLocale = options.readLocale ?? getDeviceLocale;

  let cache: Record<string, string> | null = null;

  return () => {
    if (!cache) {
      const { browser, os, platform } = detectBrowserAndOs();

      cache = {
        "X-Client": `${clientName}/${clientVersion}`,
        "X-Device-Id": getDeviceId(storageKey),
        "X-Device-Name": `${browser} on ${os}`,
        "X-Device-Platform": platform,
        "X-Device-Type": detectDeviceType(),
        "X-Timezone": detectTimezone(),
      };
    }

    return { ...cache, "X-Locale": readLocale() };
  };
}

/**
 * A concise, human-readable device label used as the Sanctum PAT name
 * during login (backend's `device_name` field on `LoginData`).
 */
export function deviceLabel(): string {
  const { browser, os } = detectBrowserAndOs();

  return `${browser} on ${os}`;
}
