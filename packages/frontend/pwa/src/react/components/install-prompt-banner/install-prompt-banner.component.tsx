/**
 * @file install-prompt-banner.component.tsx
 * @module @stackra/pwa/react/components
 * @description Install prompt banner — HeroUI `Card` for Chromium,
 *   modal-style iOS Safari tutorial when the browser can't fire
 *   `beforeinstallprompt`.
 *
 *   Auto-detects iOS Safari via {@link detectIosSafari} and renders a
 *   two-step tutorial (tap Share → tap Add to Home Screen) with
 *   inline SVG glyphs (no new icon peer dep).
 */

import type { ReactElement } from 'react';
import { Button, Card } from '@stackra/ui/react';

import { useInstallPrompt } from '@/react/hooks/use-install-prompt/use-install-prompt.hook';
import type { InstallPromptBannerProps } from './install-prompt-banner.interface';

/** Inline share icon — iOS Safari share sheet glyph. */
function ShareGlyph(): ReactElement {
  // Two-tone rendering via `currentColor` on stroke + fill keeps the
  // glyph in sync with HeroUI theming without a new icon peer.
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/** Inline plus-in-box icon — Add to Home Screen glyph. */
function AddToHomeGlyph(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

/**
 * Install prompt banner.
 *
 * @example
 * ```tsx
 * import { InstallPromptBanner } from '@stackra/pwa/react';
 *
 * function AppShell() {
 *   return (
 *     <>
 *       <MainRoutes />
 *       <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl p-4">
 *         <InstallPromptBanner />
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
export function InstallPromptBanner({
  title = 'Install this app',
  description = 'Add to your home screen for offline access and a native feel.',
  installLabel = 'Install',
  dismissLabel = 'Not now',
  className,
  onInstall,
  onDismiss,
}: InstallPromptBannerProps = {}): ReactElement | null {
  const { isVisible, isInstalled, isSupported, isIosSafari, promptInstall, dismiss } =
    useInstallPrompt();

  // Hide entirely when the app is already installed OR the service
  // hasn't decided the banner should be visible.
  if (isInstalled) return null;
  // iOS Safari never sets `isSupported` (no `beforeinstallprompt`),
  // but the tutorial is still worth surfacing. `isVisible` uses the
  // service's `install.delayMs` + `dismissCount` logic — respect it.
  if (!isVisible) return null;

  const handleInstall = async (): Promise<void> => {
    const accepted = await promptInstall();
    if (accepted) onInstall?.();
    else onDismiss?.();
  };

  const handleDismiss = (): void => {
    dismiss();
    onDismiss?.();
  };

  // iOS Safari branch — a static two-step tutorial. There's no
  // `promptInstall` API to trigger, so the primary button just
  // dismisses ("Got it") once the user has read the steps.
  if (isIosSafari) {
    return (
      <Card className={className} data-pwa-install-banner="ios">
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </Card.Header>
        <Card.Content>
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-primary">
                <ShareGlyph />
              </span>
              <span>
                Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-primary">
                <AddToHomeGlyph />
              </span>
              <span>
                Choose <strong>Add to Home Screen</strong>.
              </span>
            </li>
          </ol>
        </Card.Content>
        <Card.Footer className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onPress={handleDismiss}>
            {dismissLabel}
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  // Standard Chromium / Edge / Samsung Internet path — `Card` +
  // primary install button. `isSupported` gates the primary action
  // so a caller who mounts this banner before `beforeinstallprompt`
  // fires can still show the pre-install state gracefully.
  return (
    <Card className={className} data-pwa-install-banner="standard">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Footer className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onPress={handleDismiss}>
          {dismissLabel}
        </Button>
        <Button onPress={handleInstall} isDisabled={!isSupported}>
          {installLabel}
        </Button>
      </Card.Footer>
    </Card>
  );
}
