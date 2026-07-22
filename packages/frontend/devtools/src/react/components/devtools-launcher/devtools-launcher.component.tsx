/**
 * @file devtools-launcher.component.tsx
 * @module @stackra/devtools/react/components
 * @description Floating pill that opens the devtools shell.
 *
 *   Rendered by `<Devtools />` — sits at the bottom-right of the
 *   viewport at a fixed position via Tailwind layout utilities.
 *   Uses a HeroUI Pro `PressableFeedback` for the pill's touch
 *   feedback and a `Chip` for the label.
 */

import { useCallback, type ReactElement } from "react";
import { Chip, PressableFeedback } from "@stackra/ui/react";
import { WrenchScrewdriverIcon } from "@stackra/ui/icons/heroicon/outline";

import { useDevtoolsFrameState } from "../../hooks/use-devtools-frame-state";
import { useDevtoolsPanels } from "../../hooks/use-devtools-panels";
import type { DevtoolsLauncherProps } from "./devtools-launcher.interface";

/**
 * The floating launcher pill.
 *
 * @example
 * ```tsx
 * <DevtoolsLauncher />
 * ```
 */
export function DevtoolsLauncher({ className }: DevtoolsLauncherProps): ReactElement | null {
  const { state, update } = useDevtoolsFrameState();
  const { panels } = useDevtoolsPanels();

  const handlePress = useCallback(() => {
    update({ isOpen: !state.isOpen });
  }, [state.isOpen, update]);

  // Hide the launcher when the shell is already open — the shell
  // owns the close affordance in that state.
  if (state.isOpen) return null;

  return (
    <PressableFeedback
      aria-label="Open devtools"
      className={className ?? "fixed right-4 bottom-4 z-[2147483000] flex items-center gap-2"}
      onClick={handlePress}
      data-devtools-launcher=""
    >
      <Chip size="sm" variant="primary" color="accent">
        <Chip.Label>
          <span className="flex items-center gap-1.5">
            <WrenchScrewdriverIcon aria-hidden="true" className="size-3.5" />
            <span>Devtools</span>
            <span className="text-xs tabular-nums opacity-70">{panels.length}</span>
          </span>
        </Chip.Label>
      </Chip>
    </PressableFeedback>
  );
}
