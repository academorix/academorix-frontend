/**
 * @file register-heroui.tsx
 * @module @stackra/sdui/react/registry
 * @description Hand-registered HeroUI OSS entries — the minimum set an
 *   SDUI schema needs to render "real" UI today. The full manifest-driven
 *   registration (every HeroUI OSS + Pro export, including compound dotted
 *   keys and composed leaves for boundary-hostile compounds) lands in a
 *   future minor bump via the extractor described in `.kiro/specs/sdui/tasks.md`.
 */

import { Alert, Badge, Button, Card, Chip, Input, Kbd, Spinner } from "@stackra/ui/react";
import type { ComponentRegistry } from "@/core/registries/component.registry";

/**
 * Register the load-bearing HeroUI OSS components. Every entry is a
 * straight passthrough — the mapProps / events fields fill in when the
 * generated manifest lands.
 */
export function registerHeroUiComponents(registry: ComponentRegistry): void {
  registry.register("Alert", { component: Alert, category: "heroui" });
  registry.register("Badge", { component: Badge, category: "heroui" });
  registry.register("Button", { component: Button, category: "heroui" });
  registry.register("Card", { component: Card, category: "heroui" });
  registry.register("Chip", { component: Chip, category: "heroui" });
  registry.register("Input", { component: Input, category: "heroui", acceptsChildren: false });
  registry.register("Kbd", { component: Kbd, category: "heroui" });
  registry.register("Spinner", { component: Spinner, category: "heroui", acceptsChildren: false });
}
