/**
 * @file device.ts
 * @module lib/http/device
 *
 * @description
 * Derives the `X-Device-*`, `X-Client`, `X-Timezone`, and `X-Locale` headers
 * the backend uses for session records + audit trails (see PLAN.md §6). All
 * values are computed once at boot from `window.navigator` and cached, so the
 * interceptor stays cheap on every request.
 *
 * ### `X-Device-Id`
 * A stable UUID persisted in `localStorage` so the same browser reports the
 * same device across sessions (matching how a native app would identify a
 * device install). If storage is unavailable (private mode, tests) we mint a
 * per-session UUID instead — the header is still sent so the backend can
 * correlate a single load.
 */

/** `localStorage` key under which the device UUID is persisted. */
const DEVICE_ID_KEY = "academorix.device.id";

/** Lazily initialised device UUID (persisted). */
let cachedDeviceId: string | null = null;

/** Lazily initialised device header set (computed once per boot). */
let cachedHeaders: Record<string, string> | null = null;

/**
 * Generates a UUIDv4 string. Uses the Web Crypto API when available and falls
 * back to a `Math.random`-based generator (weaker uniqueness but always works).
 */
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
export function getDeviceId(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(DEVICE_ID_KEY);

      if (stored) {
        cachedDeviceId = stored;

        return stored;
      }

      const fresh = generateUuid();

      window.localStorage.setItem(DEVICE_ID_KEY, fresh);
      cachedDeviceId = fresh;

      return fresh;
    }
  } catch {
    // Fall through to session-scoped id.
  }

  cachedDeviceId = generateUuid();

  return cachedDeviceId;
}

/**
 * Best-effort browser + OS detection. Prefers `userAgentData` (Chromium) and
 * falls back to `userAgent` string sniffing. Returns strings safe to send as
 * headers (no PII, no user-supplied content).
 */
function detectBrowserAndOs(): { browser: string; os: string; platform: string } {
  if (typeof navigator === "undefined") {
    return { browser: "Unknown", os: "Unknown", platform: "Unknown" };
  }

  // Modern Client Hints (Chrome, Edge, some others).
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

  // UA string fallback.
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

/** Client version pulled from Vite's build-time define (falls back to `"dev"`). */
function detectClientVersion(): string {
  // Injected by Vite via `define`; guarded so tests / SSR don't blow up.
  const version = typeof __ACADEMORIX_VERSION__ !== "undefined" ? __ACADEMORIX_VERSION__ : "dev";

  return `academorix-web/${version}`;
}

/**
 * The current UI locale, read from the `<html lang>` attribute (kept in sync by
 * `LocaleProvider`). Falls back to `navigator.language` and then `"en"`.
 */
function detectLocale(): string {
  if (typeof document !== "undefined" && document.documentElement.lang) {
    return document.documentElement.lang;
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return "en";
}

/**
 * Builds the full device-header set. Cached on first call — locale is read
 * fresh each time because it changes at runtime when the user switches
 * language (the rest is stable per-boot).
 */
export function deviceHeaders(): Record<string, string> {
  if (cachedHeaders) {
    return { ...cachedHeaders, "X-Locale": detectLocale() };
  }

  const { browser, os, platform } = detectBrowserAndOs();
  const deviceType = detectDeviceType();
  const timezone = detectTimezone();

  cachedHeaders = {
    "X-Client": detectClientVersion(),
    "X-Device-Id": getDeviceId(),
    "X-Device-Name": `${browser} on ${os}`,
    "X-Device-Platform": platform,
    "X-Device-Type": deviceType,
    "X-Timezone": timezone,
  };

  return { ...cachedHeaders, "X-Locale": detectLocale() };
}

/**
 * A concise, human-readable device label used as the Sanctum PAT name during
 * login (backend's `device_name` field on `LoginData`).
 */
export function deviceLabel(): string {
  const { browser, os } = detectBrowserAndOs();

  return `${browser} on ${os}`;
}

/** For tests only — resets the cache so a subsequent call recomputes. */
export function __resetDeviceCacheForTests(): void {
  cachedDeviceId = null;
  cachedHeaders = null;
}

// Ambient declaration so the file compiles when Vite has not yet injected
// the `__ACADEMORIX_VERSION__` define (development, tests, storybook).
declare const __ACADEMORIX_VERSION__: string | undefined;
