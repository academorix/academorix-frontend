/**
 * @file devtools-shell.component.tsx
 * @module @stackra/devtools/native/components
 * @description Native devtools shell — a HeroUI Native `BottomSheet`
 *   compound with a horizontal chip rail + panel viewport.
 *
 *   The compound is `BottomSheet` (root) → `BottomSheet.Portal` →
 *   `BottomSheet.Overlay` + `BottomSheet.Content` per the
 *   `heroui-native@1.0.5` compound-first API. There is no
 *   `.Root` alias — the compound's root and `Object.assign` target
 *   is the `BottomSheet` symbol itself. Same pattern the
 *   `@stackra/notifications/native` drawer uses.
 */

import { useCallback, type ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import { BottomSheet, Chip, PressableFeedback } from "@stackra/ui/native";

import { useNativeDevtoolsFrameState } from "../../hooks/use-native-devtools-frame-state.hook";
import { useNativeDevtoolsPanels } from "../../hooks/use-native-devtools-panels.hook";
import { DevtoolsPanelView } from "../devtools-panel-view";
import type { DevtoolsShellProps } from "./devtools-shell.interface";

/**
 * The native devtools shell.
 *
 * @example
 * ```tsx
 * // Mount alongside the launcher via `<Devtools />`.
 * <Devtools />
 * ```
 */
export function DevtoolsShell(_props: DevtoolsShellProps = {}): ReactElement {
  const { state, update } = useNativeDevtoolsFrameState();
  const { panels, find } = useNativeDevtoolsPanels();

  const handleClose = useCallback(() => update({ isOpen: false }), [update]);
  const handleSelect = useCallback(
    (panelId: string) => update({ activePanelId: panelId }),
    [update],
  );

  // The active panel object is resolved via the registry so a re-
  // register (last-wins on the same id) surfaces immediately.
  const active = state.activePanelId ? find(state.activePanelId) : null;

  return (
    <BottomSheet
      isOpen={state.isOpen}
      onOpenChange={(open: boolean) => {
        // The bottom sheet is controlled — when the user drags it
        // shut / taps the overlay, mirror the close through the
        // frame-state service so persistence and other consumers
        // see the change.
        if (!open) handleClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          {/* HeroUI Native's BottomSheet.Title accepts a plain
              string child; keep it short so the sheet's header
              doesn't wrap on small screens. */}
          <BottomSheet.Title>Devtools</BottomSheet.Title>
          <View className="flex-1">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, padding: 12 }}
            >
              {panels.map((panel) => {
                const isActive = panel.id === state.activePanelId;
                return (
                  <PressableFeedback
                    key={panel.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => handleSelect(panel.id)}
                  >
                    <Chip
                      color={isActive ? "accent" : "default"}
                      size="sm"
                      variant={isActive ? "primary" : "secondary"}
                    >
                      <Chip.Label>{panel.title}</Chip.Label>
                    </Chip>
                  </PressableFeedback>
                );
              })}
            </ScrollView>
            <View className="min-h-[200px] flex-1">
              {active ? (
                <DevtoolsPanelView panel={active} />
              ) : (
                <View className="p-4">
                  {panels.length === 0 ? (
                    <Text className="text-muted text-sm">No panels registered yet.</Text>
                  ) : (
                    <Text className="text-muted text-sm">Select a panel above to inspect it.</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
