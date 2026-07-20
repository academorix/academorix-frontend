/**
 * @file index.ts
 * @module @stackra/pwa/react/hooks
 * @description Barrel export for every web-side PWA hook.
 */

export { usePwa, type IUsePwaResult } from "./use-pwa";
export { useInstallPrompt, type IUseInstallPromptResult } from "./use-install-prompt";
export { useUpdatePrompt, type IUseUpdatePromptResult } from "./use-update-prompt";
export { useAppUpdate, type IUseAppUpdateResult } from "./use-app-update";
export { useAppUpdateNotifier, type IUseAppUpdateNotifierOptions } from "./use-app-update-notifier";
export { useStandaloneMode } from "./use-standalone-mode";
export { useDisplayMode } from "./use-display-mode";
export { useUtmParams } from "./use-utm-params";
export { useInstallSource } from "./use-install-source";
export { useWebShare, type IUseWebShareResult, type IWebShareData } from "./use-web-share";
export { useVibration, type IUseVibrationResult, type VibrationPattern } from "./use-vibration";
export { useWakeLock, type IUseWakeLockResult } from "./use-wake-lock";
export { useVisibilityState } from "./use-visibility-state";
export { usePageVisibility, type PageVisibilityCallback } from "./use-page-visibility";
export { useAdaptiveLoading, type IUseAdaptiveLoadingResult } from "./use-adaptive-loading";
export { useSafeAreaInsets, type IUseSafeAreaInsetsResult } from "./use-safe-area-insets";
