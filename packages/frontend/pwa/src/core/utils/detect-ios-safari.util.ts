/**
 * @file detect-ios-safari.util.ts
 * @module @stackra/pwa/core/utils
 * @description SSR-safe detection for iOS Safari — the platform that
 *   never fires `beforeinstallprompt` and requires the manual
 *   "Share → Add to Home Screen" tutorial.
 */

/**
 * Returns `true` when the current browser is iOS Safari (any iOS
 * device running the Safari WebView engine including Chrome-iOS,
 * Firefox-iOS, and Edge-iOS — all of which use WebKit under the
 * hood and share the "no install prompt" limitation).
 *
 * Fail-soft: returns `false` in Node / SSR and when the UA string
 * is empty or malformed.
 */
export function detectIosSafari(): boolean {
  // SSR guard — `navigator` doesn't exist in Node.
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  if (typeof ua !== 'string' || ua.length === 0) return false;

  // iOS devices — iPhone / iPad / iPod, plus modern iPad Safari
  // that reports "MacIntel" on the platform string but still has
  // TouchEvents (the WebKit engine's tell).
  const isIos =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints > 1);
  if (!isIos) return false;

  // Every browser on iOS is WebKit under the hood, so they all
  // suffer the same "no beforeinstallprompt" restriction. Excluding
  // in-app browsers (Instagram / Facebook / WeChat WebViews) that
  // can't install PWAs at all.
  const isInAppWebView = /(FBAN|FBAV|Instagram|MicroMessenger|Line\/)/i.test(ua);
  return !isInAppWebView;
}
