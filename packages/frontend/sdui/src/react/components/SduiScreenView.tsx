/**
 * @file SduiScreenView.tsx
 * @module @stackra/sdui/react/components
 * @description `<SduiScreenView>` — the top-level component that
 *   composes theme scope → runtime provider → optional layout → tree.
 *
 *   Version-guarded: refuses to render screens outside
 *   `SDUI_MIN_SUPPORTED_VERSION..SDUI_SCHEMA_VERSION` and shows a themed
 *   diagnostic instead.
 */

import { createElement, type ReactNode } from "react";
import { useInject } from "@stackra/container/react";
import { Alert } from "@stackra/ui/react";
import type { ISduiScreen } from "@stackra/contracts";
import { SDUI_COMPONENT_REGISTRY, SDUI_LAYOUT_REGISTRY } from "@stackra/contracts";
import type { ComponentRegistry } from "@/core/registries/component.registry";
import type { LayoutRegistry } from "@/core/registries/layout.registry";
import {
  SDUI_MIN_SUPPORTED_VERSION,
  SDUI_SCHEMA_VERSION,
} from "@/core/constants/sdui-version.constant";
import type { ISduiNotification } from "@stackra/contracts";
import { SduiRuntimeProvider } from "../providers/sdui-runtime.provider";
import { SduiThemeScope } from "../providers/sdui-theme-scope";
import { SduiTree } from "../renderer/sdui-tree";

/**
 * Props for {@link SduiScreenView}.
 */
export interface ISduiScreenViewProps {
  readonly screen: ISduiScreen;
  readonly user?: Readonly<Record<string, unknown>>;
  readonly onNotify?: (notification: ISduiNotification) => void;
  /** Override the DI-managed registry (tests, tenant isolation). */
  readonly registry?: ComponentRegistry;
  /** Override the DI-managed layout registry. */
  readonly layoutRegistry?: LayoutRegistry;
}

/**
 * Version-mismatch diagnostic. Uses HeroUI `<Alert>` — no bespoke
 * Tailwind color tokens on plain elements (per the ui-components rule).
 */
function VersionDiagnostic({ actual }: { actual: number }) {
  return (
    <Alert status="danger" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Unsupported SDUI schema version {actual}</Alert.Title>
        <Alert.Description>
          Supported range: {SDUI_MIN_SUPPORTED_VERSION}&ndash;{SDUI_SCHEMA_VERSION}.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

/**
 * `<SduiScreenView>` — the top-level SDUI React entry point.
 */
export function SduiScreenView({
  screen,
  user,
  onNotify,
  registry,
  layoutRegistry,
}: ISduiScreenViewProps) {
  const injectedRegistry = useInject<ComponentRegistry>(SDUI_COMPONENT_REGISTRY);
  const injectedLayouts = useInject<LayoutRegistry>(SDUI_LAYOUT_REGISTRY);
  const activeRegistry = registry ?? injectedRegistry;
  const activeLayouts = layoutRegistry ?? injectedLayouts;

  if (
    screen.schemaVersion < SDUI_MIN_SUPPORTED_VERSION ||
    screen.schemaVersion > SDUI_SCHEMA_VERSION
  ) {
    return <VersionDiagnostic actual={screen.schemaVersion} />;
  }

  const tree = <SduiTree root={screen.root} registry={activeRegistry} />;
  const layout = screen.layout ? activeLayouts.resolve(screen.layout) : undefined;

  const inner: ReactNode = layout ? createElement(layout.component as never, {}, tree) : tree;

  return (
    <SduiThemeScope theme={screen.theme}>
      <SduiRuntimeProvider data={screen.data} user={user} onNotify={onNotify}>
        {inner}
      </SduiRuntimeProvider>
    </SduiThemeScope>
  );
}
