/**
 * @file use-settings-schema.hook.ts
 * @module @stackra/settings/core/hooks
 * @description Reactive schema hook — the current list of registered
 *   settings groups.
 *
 *   Re-renders when the schema-loaded event fires (a remote schema
 *   fetch completed) or when a `forFeature` registration runs during
 *   `onApplicationBootstrap`.
 */

import { useEffect, useState } from "react";
import { useInject, useOptionalInject } from "@stackra/container/react";
import {
  EVENT_EMITTER,
  SETTINGS_EVENTS,
  SETTINGS_REGISTRY,
  type IEventEmitter,
  type ISettingDefinition,
  type ISettingsRegistry,
} from "@stackra/contracts";

/**
 * Subscribe to the current settings schema — every registered group
 * sorted by `order`.
 *
 * @example
 * ```tsx
 * function SettingsNav() {
 *   const groups = useSettingsSchema();
 *   return (
 *     <ul>
 *       {groups.map((g) => (
 *         <li key={g.key}>{g.label}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useSettingsSchema(): readonly ISettingDefinition[] {
  const registry = useInject<ISettingsRegistry>(SETTINGS_REGISTRY);
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);

  const [snapshot, setSnapshot] = useState<readonly ISettingDefinition[]>(() => registry.all());

  useEffect(() => {
    // Re-poll the registry every time a schema-affecting event fires.
    // We poll rather than diff because the event payload is coarse
    // and the registry is authoritative.
    const refresh = (): void => {
      setSnapshot(registry.all());
    };

    // Refresh at least once after mount so late-boot `forFeature`
    // registrations (which run in `onApplicationBootstrap`) surface
    // even without an event.
    refresh();

    if (!events) return;

    const offSchemaLoaded = events.on(SETTINGS_EVENTS.SCHEMA_LOADED, refresh);
    return () => {
      offSchemaLoaded();
    };
  }, [registry, events]);

  return snapshot;
}
