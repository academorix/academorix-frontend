/**
 * @file notification-preferences-page.component.tsx
 * @module @stackra/notifications/native/pages
 * @description Native full-screen preferences editor — the native
 *   counterpart of the web `NotificationPreferencesPage`.
 *
 *   Composes:
 *   - Push permission section (state hint + Enable button).
 *   - Global do-not-disturb switch.
 *   - Quiet-hours picker.
 *   - Category × channel matrix.
 *   - Save affordance in the footer.
 *
 *   Save fires the caller-supplied `writer.updatePreferences(...)`
 *   through {@link useNotificationWrites}; optimistic local
 *   mutations flow through {@link useNotificationPreferences}.
 */

import { useState, type ReactElement } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, Separator, Switch } from '@stackra/ui/native';

import { isQuietHoursWindow } from '@/core/utils';
import type { IQuietHoursWindow } from '@/core/interfaces';

import {
  CategoryPreferencesPanel,
  type ChannelDescriptor,
} from '../../components/preferences/category-preferences-panel';
import { QuietHoursPicker } from '../../components/preferences/quiet-hours-picker';
import {
  useNotificationPermission,
  useNotificationPreferences,
  useNotificationWrites,
} from '../../hooks';
import type { NotificationPreferencesPageProps } from './notification-preferences-page.interface';

/**
 * Default channel surface on native — mirrors what the native push
 * driver ships out of the box.
 */
const DEFAULT_CHANNELS: readonly ChannelDescriptor[] = [
  { id: 'in-app', label: 'In-app' },
  { id: 'os-notification', label: 'Push' },
];

/**
 * The native preferences screen.
 *
 * @example
 * ```tsx
 * import { NotificationPreferencesPage } from '@stackra/notifications/native';
 * <NotificationPreferencesPage writer={apiWriter} />
 * ```
 */
export function NotificationPreferencesPage({
  channels = DEFAULT_CHANNELS,
  writer,
  className,
}: NotificationPreferencesPageProps = {}): ReactElement {
  const { preferences, setQuietHours, clearQuietHours, patch } = useNotificationPreferences();
  const { updatePreferences, isPending } = useNotificationWrites(writer);
  const { permission, isSupported, request } = useNotificationPermission();

  const dndEnabled = preferences.defaults['do_not_disturb'] === true;

  const quietHoursValue: IQuietHoursWindow | null = isQuietHoursWindow(preferences.quiet_hours)
    ? preferences.quiet_hours
    : null;

  const [busy, setBusy] = useState(false);

  const handleSave = async (): Promise<void> => {
    setBusy(true);
    try {
      await updatePreferences(preferences);
    } finally {
      setBusy(false);
    }
  };

  const handleEnablePush = async (): Promise<void> => {
    await request();
  };

  return (
    <ScrollView className={className} contentContainerStyle={{ padding: 16, gap: 24 }}>
      <View className="gap-1">
        <Text className="text-xl font-semibold text-foreground">Notification preferences</Text>
        <Text className="text-sm text-muted">
          Choose which categories reach you on which channels. Safety alerts always come through OS
          notifications.
        </Text>
      </View>

      {/* Push section — surfaces current permission state + prompt. */}
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">Notifications</Text>
          <Text className="text-xs text-muted">
            OS notifications reach you when the app is in the background.
          </Text>
        </View>
        {!isSupported ? (
          <Text className="text-sm text-muted">
            This device doesn&apos;t support OS notifications.
          </Text>
        ) : permission === 'default' ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm text-muted">
              Notifications are off. Enable them to get instant alerts.
            </Text>
            <Button
              size="sm"
              onPress={() => {
                void handleEnablePush();
              }}
            >
              <Button.Label>Enable</Button.Label>
            </Button>
          </View>
        ) : permission === 'denied' ? (
          <Text className="text-sm text-danger">
            Notifications are blocked. Update the app&apos;s notification permission from the system
            settings.
          </Text>
        ) : (
          <Text className="text-sm text-success">Notifications are on.</Text>
        )}
      </View>

      {/* DND — single switch. */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-foreground">Do not disturb</Text>
        <View className="flex-row items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3">
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground">Global do-not-disturb</Text>
            <Text className="mt-0.5 text-xs text-muted">
              Suppresses every notification except safety alerts.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Do not disturb"
            isSelected={dndEnabled}
            onSelectedChange={(next: boolean) => patch({ do_not_disturb: next })}
          >
            <Switch.Thumb />
          </Switch>
        </View>
      </View>

      <Separator />

      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-semibold text-foreground">Quiet hours</Text>
          <Text className="text-sm text-muted">
            OS-level notifications are held during this window; in-app entries still arrive.
          </Text>
        </View>
        <QuietHoursPicker value={quietHoursValue} onChange={setQuietHours} />
        {quietHoursValue ? (
          <Button className="self-start" size="sm" variant="tertiary" onPress={clearQuietHours}>
            <Button.Label>Clear quiet hours</Button.Label>
          </Button>
        ) : null}
      </View>

      <Separator />

      <View className="gap-4">
        <Text className="text-base font-semibold text-foreground">Categories</Text>
        <CategoryPreferencesPanel channels={channels} />
      </View>

      <Separator />

      <View className="flex-row items-center justify-end">
        <Button
          accessibilityLabel="Save preferences"
          isDisabled={busy || isPending}
          onPress={() => {
            void handleSave();
          }}
        >
          <Button.Label>Save preferences</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
