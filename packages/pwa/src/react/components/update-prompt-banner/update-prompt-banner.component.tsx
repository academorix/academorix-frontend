/**
 * @file update-prompt-banner.component.tsx
 * @module @stackra/pwa/react/components
 * @description HeroUI `Alert`-based service-worker update banner.
 *
 *   Reads the update state via {@link useUpdatePrompt}; renders
 *   nothing when no update is available (or the banner has been
 *   dismissed for the session).
 */

import type { ReactElement } from 'react';
import { Alert, Button } from '@stackra/ui/react';

import { useUpdatePrompt } from '@/react/hooks/use-update-prompt/use-update-prompt.hook';
import type { UpdatePromptBannerProps } from './update-prompt-banner.interface';

/**
 * Update prompt banner.
 *
 * @example
 * ```tsx
 * import { UpdatePromptBanner } from '@stackra/pwa/react';
 *
 * function AppShell() {
 *   return (
 *     <>
 *       <MainRoutes />
 *       <div className="fixed inset-x-0 top-0 z-40 p-2">
 *         <UpdatePromptBanner />
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
export function UpdatePromptBanner({
  title = 'Update available',
  message = 'A new version is ready — refresh to apply it.',
  updateLabel = 'Refresh',
  dismissLabel = 'Later',
  className,
}: UpdatePromptBannerProps = {}): ReactElement | null {
  const { isVisible, accept, dismiss } = useUpdatePrompt();
  if (!isVisible) return null;

  return (
    <Alert status="accent" className={className} data-pwa-update-banner>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
      {/*
        HeroUI Alert doesn't ship a slotted action area on every
        variant, so the buttons follow the alert content inside the
        flex row.
      */}
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="ghost" onPress={dismiss}>
          {dismissLabel}
        </Button>
        <Button size="sm" onPress={accept}>
          {updateLabel}
        </Button>
      </div>
    </Alert>
  );
}
