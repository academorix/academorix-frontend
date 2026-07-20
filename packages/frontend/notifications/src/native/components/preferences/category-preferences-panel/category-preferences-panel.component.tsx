/**
 * @file category-preferences-panel.component.tsx
 * @module @stackra/notifications/native/components/preferences
 * @description Native category × channel enable-matrix panel.
 *
 *   Iterates every category × channel pair and renders one
 *   {@link ChannelToggle} per cell. Uses the shared
 *   {@link NotificationPreferencesService} through
 *   {@link useNotificationPreferences} so toggles auto-persist to
 *   the service snapshot; a caller-supplied writer wires the HTTP
 *   round-trip on top.
 */

import type { ReactElement } from 'react';
import { View, Text } from 'react-native';

import { MANDATORY_ON_MATRIX, NOTIFICATION_CATEGORIES } from '@/core/constants';
import type { NotificationCategory } from '@/core/interfaces';

import { useNotificationPreferences } from '../../../hooks';
import { ChannelToggle } from '../channel-toggle';
import type { CategoryPreferencesPanelProps } from './category-preferences-panel.interface';

/**
 * The native category × channel matrix.
 *
 * @example
 * ```tsx
 * <CategoryPreferencesPanel
 *   channels={[
 *     { id: 'in-app', label: 'In-app' },
 *     { id: 'os-notification', label: 'Push' },
 *   ]}
 * />
 * ```
 */
export function CategoryPreferencesPanel({
  channels,
  className,
}: CategoryPreferencesPanelProps): ReactElement {
  const { isChannelEnabled, setChannelEnabled } = useNotificationPreferences();
  const categories = Object.values(NOTIFICATION_CATEGORIES);

  return (
    <View className={`gap-6${className ? ` ${className}` : ''}`}>
      {categories.map((category) => (
        <View key={category.key} className="gap-2">
          <View className="gap-0.5">
            <Text className="text-sm font-semibold text-foreground capitalize">
              {category.label}
            </Text>
            <Text className="text-xs text-muted">{category.description}</Text>
          </View>
          <View className="gap-2">
            {channels.map((channel) => {
              const key = `${category.key}.${channel.id}`;
              const isMandatoryOn = (
                MANDATORY_ON_MATRIX[category.key as NotificationCategory] ?? []
              ).includes(channel.id);
              const isEnabled = isChannelEnabled(category.key as NotificationCategory, channel.id);
              return (
                <ChannelToggle
                  key={key}
                  id={key}
                  isEnabled={isEnabled}
                  isMandatoryOn={isMandatoryOn}
                  label={channel.label}
                  note={
                    isMandatoryOn ? 'Always on — safety alerts bypass every filter.' : channel.note
                  }
                  onChange={(next) =>
                    setChannelEnabled(category.key as NotificationCategory, channel.id, next)
                  }
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
