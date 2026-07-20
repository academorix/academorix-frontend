/**
 * @file devtools-launcher.component.tsx
 * @module @stackra/devtools/native/components
 * @description Native launcher pill — a `Chip` inside a
 *   `PressableFeedback` from `@stackra/ui/native`.
 *
 *   The pill is absolutely-positioned at bottom-right via
 *   `Uniwind`/`NativeWind` Tailwind classes on the container `View`.
 *   The `className` prop on `View` is enabled by the ambient
 *   augmentation in `../types/uniwind.d.ts`.
 */

import { type ReactElement } from "react";
import { View } from "react-native";
import { Chip, PressableFeedback } from "@stackra/ui/native";

import { useNativeDevtoolsFrameState } from "../../hooks/use-native-devtools-frame-state.hook";
import { useNativeDevtoolsPanels } from "../../hooks/use-native-devtools-panels.hook";
import type { DevtoolsLauncherProps } from "./devtools-launcher.interface";

/**
 * The native devtools launcher.
 *
 * @example
 * ```tsx
 * import { DevtoolsLauncher } from '@stackra/devtools/native';
 *
 * <DevtoolsLauncher />
 * ```
 */
export function DevtoolsLauncher({ className }: DevtoolsLauncherProps): ReactElement | null {
  const { state, update } = useNativeDevtoolsFrameState();
  const { panels } = useNativeDevtoolsPanels();

  // Hide the launcher while the shell is open — the sheet owns the
  // close affordance in that state (drag-to-dismiss + overlay tap).
  if (state.isOpen) return null;

  // Inline style keeps the launcher positioned even on RN targets
  // where the consumer hasn't wired Uniwind — Tailwind layout
  // utilities still tighten spacing when they resolve.
  return (
    <View
      className={className}
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: 999_999,
      }}
    >
      <PressableFeedback
        accessibilityLabel="Open devtools"
        accessibilityRole="button"
        onPress={() => update({ isOpen: true })}
      >
        <Chip color="accent" size="sm" variant="primary">
          <Chip.Label>{`Devtools · ${panels.length}`}</Chip.Label>
        </Chip>
      </PressableFeedback>
    </View>
  );
}
