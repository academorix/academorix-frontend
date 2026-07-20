/**
 * @file category-preferences-panel.component.tsx
 * @module @stackra/notifications/react/components/preferences
 * @description Category × channel enable-matrix panel.
 *
 *   Iterates every category × channel pair and renders one
 *   {@link ChannelToggle} per cell. Uses the shared
 *   {@link NotificationPreferencesService} through
 *   {@link useNotificationPreferences} so toggles auto-persist to
 *   the service snapshot; a caller-supplied writer can wire the
 *   HTTP round-trip on top.
 */

import type { ReactElement } from "react";

import { MANDATORY_ON_MATRIX, NOTIFICATION_CATEGORIES } from "@/core/constants";
import type { NotificationCategory } from "@/core/interfaces";
import { useNotificationPreferences } from "../../../hooks/use-notification-preferences";
import { ChannelToggle } from "../channel-toggle";
import type { CategoryPreferencesPanelProps } from "./category-preferences-panel.interface";

/**
 * The category × channel matrix.
 *
 * @example
 * ```tsx
 * <CategoryPreferencesPanel
 *   channels={[
 *     { id: 'in-app', label: 'In-app' },
 *     { id: 'os-notification', label: 'Push' },
 *     { id: 'email', label: 'Email' },
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
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-2${className ? ` ${className}` : ""}`}
      data-notifications-category-preferences=""
    >
      {categories.map((category) => (
        <div
          key={category.key}
          className="flex flex-col gap-2"
          data-notifications-category={category.key}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-semibold capitalize">
              {category.label}
            </span>
            <span className="text-muted text-xs">{category.description}</span>
          </div>
          <div className="flex flex-col gap-2">
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
                  label={channel.label}
                  isEnabled={isEnabled}
                  isMandatoryOn={isMandatoryOn}
                  note={
                    isMandatoryOn ? "Always on — safety alerts bypass every filter." : channel.note
                  }
                  onChange={(next) =>
                    setChannelEnabled(category.key as NotificationCategory, channel.id, next)
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
