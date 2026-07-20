/**
 * @file notification-preferences-page.component.tsx
 * @module @stackra/notifications/react/pages
 * @description `/notifications/preferences` — full-page preferences
 *   editor.
 *
 *   Composes the push section, DND switch, quiet-hours picker, and
 *   category × channel matrix. Save fires the caller-supplied
 *   `writer.updatePreferences(...)` (through
 *   {@link useNotificationWrites}); optimistic local mutations flow
 *   through {@link useNotificationPreferences}.
 */

import { useState, type ReactElement } from 'react';
import { Button, Separator, Switch, toast } from '@stackra/ui/react';

import { isQuietHoursWindow } from '@/core/utils';
import type { IQuietHoursWindow } from '@/core/interfaces';
import { useNotificationPermission } from '../../hooks/use-notification-permission';
import { useNotificationPreferences } from '../../hooks/use-notification-preferences';
import { useNotificationWrites } from '../../hooks/use-notification-writes';
import { usePushSubscription } from '../../hooks/use-push-subscription';
import {
  CategoryPreferencesPanel,
  type ChannelDescriptor,
} from '../../components/preferences/category-preferences-panel';
import { QuietHoursPicker } from '../../components/preferences/quiet-hours-picker';
import type { NotificationPreferencesPageProps } from './notification-preferences-page.interface';

/** Default channel surface — matches the built-in drivers. */
const DEFAULT_CHANNELS: readonly ChannelDescriptor[] = [
  { id: 'in-app', label: 'In-app' },
  { id: 'os-notification', label: 'Push' },
  { id: 'email', label: 'Email', note: 'Requires the email adapter.' },
];

/**
 * The preferences page.
 *
 * @example
 * ```tsx
 * import { NotificationPreferencesPage } from '@stackra/notifications/react';
 *
 * function PreferencesRoute() {
 *   return <NotificationPreferencesPage writer={apiWriter} />;
 * }
 * ```
 */
export function NotificationPreferencesPage({
  channels = DEFAULT_CHANNELS,
  writer,
  className,
}: NotificationPreferencesPageProps = {}): ReactElement {
  const { preferences, setQuietHours, clearQuietHours, patch } = useNotificationPreferences();
  const { updatePreferences, isPending } = useNotificationWrites(writer);
  const { permission, isSupported } = useNotificationPermission();
  const { subscribe, isPending: isSubscribing } = usePushSubscription();

  // DND is folded into the shared `defaults` bag under the
  // conventional `do_not_disturb` key so it round-trips through
  // the same writer.
  const dndEnabled = preferences.defaults['do_not_disturb'] === true;

  const quietHoursValue: IQuietHoursWindow | null = isQuietHoursWindow(preferences.quiet_hours)
    ? preferences.quiet_hours
    : null;

  const [busy, setBusy] = useState(false);

  const handleSave = async (): Promise<void> => {
    setBusy(true);
    try {
      await updatePreferences(preferences);
      toast.success('Preferences saved', {
        description: 'Your changes are live for this account.',
      });
    } catch {
      toast.danger('Could not save preferences', {
        description: 'Please retry in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleEnablePush = async (): Promise<void> => {
    const sub = await subscribe();
    if (sub) {
      toast.success('Push notifications enabled');
    } else {
      toast.info('Push notifications remain disabled', {
        description: 'You can enable them any time from this page.',
      });
    }
  };

  return (
    <div
      className={`flex flex-col gap-6 p-6${className ? ` ${className}` : ''}`}
      data-notifications-preferences-page=""
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Notification preferences</h1>
        <p className="text-sm text-muted">
          Choose which categories reach you on which channels. Safety alerts always come through OS
          notifications.
        </p>
      </header>

      {/* Push section — surfaces the current permission state and
          an "Enable push" affordance when the user hasn't decided
          yet. */}
      <section
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        data-notifications-push-section=""
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Browser push</h2>
          <p className="text-xs text-muted">
            Push notifications reach you when the app is closed or in the background.
          </p>
        </div>
        {!isSupported ? (
          <p className="text-sm text-muted">This browser doesn't support Web Push.</p>
        ) : permission === 'default' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Push is off. Enable it to get instant alerts.</p>
            <Button
              size="sm"
              isDisabled={isSubscribing}
              onPress={() => {
                void handleEnablePush();
              }}
            >
              Enable push
            </Button>
          </div>
        ) : permission === 'denied' ? (
          <p className="text-sm text-danger">
            Push is blocked for this site. Update the notification permission in your browser
            settings to re-enable it.
          </p>
        ) : (
          <p className="text-sm text-success">Push is on for this browser.</p>
        )}
      </section>

      {/* DND — a single switch that toggles the `do_not_disturb`
          scalar in the shared defaults bag. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">Do not disturb</h2>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-foreground">Global do-not-disturb</span>
            <span className="mt-0.5 text-xs text-muted">
              Suppresses every notification except safety alerts.
            </span>
          </div>
          <Switch
            aria-label="Do not disturb"
            isSelected={dndEnabled}
            onChange={(next) => patch({ do_not_disturb: next })}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Quiet hours</h2>
          <p className="text-sm text-muted">
            OS-level notifications are held during this window; in-app entries still arrive.
          </p>
        </div>
        <QuietHoursPicker value={quietHoursValue} onChange={setQuietHours} />
        {quietHoursValue ? (
          <Button className="self-start" size="sm" variant="tertiary" onPress={clearQuietHours}>
            Clear quiet hours
          </Button>
        ) : null}
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Categories</h2>
        <CategoryPreferencesPanel channels={channels} />
      </section>

      <Separator />

      <footer className="flex items-center justify-end gap-2">
        <Button
          aria-label="Save preferences"
          isDisabled={busy || isPending}
          onPress={() => {
            void handleSave();
          }}
        >
          Save preferences
        </Button>
      </footer>
    </div>
  );
}
