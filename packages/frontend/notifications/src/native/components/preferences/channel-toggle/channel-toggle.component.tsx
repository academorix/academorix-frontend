/**
 * @file channel-toggle.component.tsx
 * @module @stackra/notifications/native/components/preferences
 * @description Native single channel × category toggle row.
 *
 *   Uses HeroUI Native's `Switch` compound. Mandatory-on rows
 *   render the switch as visually on and read-only — matching the
 *   web behaviour for safety × push.
 */

import type { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { Switch } from '@stackra/ui/native';

import type { ChannelToggleProps } from './channel-toggle.interface';

/**
 * Native channel toggle row.
 *
 * @example
 * ```tsx
 * <ChannelToggle
 *   id="operational.in-app"
 *   label="In-app"
 *   isEnabled={true}
 *   onChange={(next) => save(next)}
 * />
 * ```
 */
export function ChannelToggle({
  id,
  label,
  note,
  isEnabled,
  isMandatoryOn = false,
  onChange,
}: ChannelToggleProps): ReactElement {
  return (
    <View
      accessibilityLabel={id}
      className="flex-row items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3"
    >
      <View className="flex-1 flex-col">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        {note ? <Text className="mt-0.5 text-xs text-muted">{note}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        isDisabled={isMandatoryOn}
        isSelected={isMandatoryOn || isEnabled}
        onSelectedChange={(next: boolean) => {
          // Mandatory-on pairs are locked ON — silently ignore
          // attempts to toggle them so callers don't need to
          // duplicate the check.
          if (isMandatoryOn) return;
          onChange(next);
        }}
      >
        <Switch.Thumb />
      </Switch>
    </View>
  );
}
