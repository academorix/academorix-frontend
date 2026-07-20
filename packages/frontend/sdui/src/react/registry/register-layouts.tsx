/**
 * @file register-layouts.tsx
 * @module @stackra/sdui/react/registry
 * @description Built-in layout templates for the six well-known SDUI
 *   scenes. Each is a minimal composition today (top bar + children);
 *   richer HeroUI Pro compositions land alongside the manifest extractor.
 */

import type { ReactNode } from "react";
import { SduiViewKind } from "@stackra/contracts";
import type { LayoutRegistry } from "@/core/registries/layout.registry";

interface ISceneShellProps {
  readonly children: ReactNode;
}

function SceneShell({ children }: ISceneShellProps) {
  return <div className="flex flex-col gap-4 p-4">{children}</div>;
}

function ListLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}
function ShowLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}
function CreateLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}
function EditLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}
function AnalyticsLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}
function OverviewLayout({ children }: ISceneShellProps) {
  return <SceneShell>{children}</SceneShell>;
}

/**
 * Register the six built-in scene layouts under the `SduiViewKind` keys.
 */
export function registerBuiltInLayouts(registry: LayoutRegistry): void {
  registry.register(SduiViewKind.List, { key: SduiViewKind.List, component: ListLayout });
  registry.register(SduiViewKind.Show, { key: SduiViewKind.Show, component: ShowLayout });
  registry.register(SduiViewKind.Create, { key: SduiViewKind.Create, component: CreateLayout });
  registry.register(SduiViewKind.Edit, { key: SduiViewKind.Edit, component: EditLayout });
  registry.register(SduiViewKind.Analytics, {
    key: SduiViewKind.Analytics,
    component: AnalyticsLayout,
  });
  registry.register(SduiViewKind.Overview, {
    key: SduiViewKind.Overview,
    component: OverviewLayout,
  });
}
