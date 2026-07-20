/**
 * @file index.ts
 * @module @stackra/pwa/react
 * @description React (web) bindings for `@stackra/pwa`.
 *
 *   Hooks and components subscribe to the DI `PwaService` via
 *   `useSyncExternalStore` for tearing-free reads under concurrent
 *   React.
 *
 *   Re-exports `useNetworkStatus` + `<OfflineBanner>` from
 *   `@stackra/network/react` so a consumer imports every PWA-adjacent
 *   piece from one subpath — network detection stays owned by
 *   `@stackra/network`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════════════════
export {
  usePwa,
  useInstallPrompt,
  useUpdatePrompt,
  useStandaloneMode,
  useDisplayMode,
  useUtmParams,
  useInstallSource,
  useWebShare,
  useVibration,
  useWakeLock,
  useVisibilityState,
  usePageVisibility,
  useAdaptiveLoading,
  useSafeAreaInsets,
  type IUsePwaResult,
  type IUseInstallPromptResult,
  type IUseUpdatePromptResult,
  type IUseWebShareResult,
  type IWebShareData,
  type IUseVibrationResult,
  type VibrationPattern,
  type IUseWakeLockResult,
  type PageVisibilityCallback,
  type IUseAdaptiveLoadingResult,
  type IUseSafeAreaInsetsResult,
} from "./hooks";

// ════════════════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════════════════
export {
  InstallPromptBanner,
  UpdatePromptBanner,
  SplashScreen,
  InstallQrCode,
  PwaHead,
  type InstallPromptBannerProps,
  type UpdatePromptBannerProps,
  type SplashScreenProps,
  type InstallQrCodeProps,
  type PwaHeadProps,
  type IPwaHeadAppleIcon,
  type IPwaHeadAppleStartupImage,
} from "./components";

// ════════════════════════════════════════════════════════════════════════════════
// Convenience re-exports from @stackra/network (network detection is
// theirs — the re-export lets consumers pull every PWA piece from a
// single subpath).
// ════════════════════════════════════════════════════════════════════════════════
export { useNetworkStatus, OfflineBanner } from "@stackra/network/react";
export type { UseNetworkStatusResult, OfflineBannerProps } from "@stackra/network/react";
