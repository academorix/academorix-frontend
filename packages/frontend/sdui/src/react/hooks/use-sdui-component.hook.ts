/**
 * @file use-sdui-component.hook.ts
 * @module @stackra/sdui/react/hooks
 * @description `useSduiComponent(type)` — resolve a registered
 *   component entry from the DI-managed {@link ComponentRegistry}.
 */

import { useInject } from '@stackra/container/react';
import type { ISduiComponentEntry } from '@stackra/contracts';
import { SDUI_COMPONENT_REGISTRY } from '@stackra/contracts';
import type { ComponentRegistry } from '@/core/registries/component.registry';

/**
 * Resolve an SDUI component entry by node `type`.
 */
export function useSduiComponent(type: string): ISduiComponentEntry | undefined {
  const registry = useInject<ComponentRegistry>(SDUI_COMPONENT_REGISTRY);
  return registry.resolve(type);
}
