/**
 * @file devtools-shell.component.tsx
 * @module @stackra/devtools/react/components
 * @description The main devtools drawer — HeroUI `Drawer` compound
 *   with a categorised nav rail + panel viewport.
 *
 *   Uses `Drawer.Backdrop` as the controlled overlay (see the
 *   pattern in `notifications/react/components/notification-drawer`
 *   — the workspace canonical form). The drawer's placement is
 *   driven by `frameState.position`, so a change flushes through
 *   the frame-state service and the drawer moves.
 */

import { useCallback, useEffect, type ReactElement } from "react";
import { Str } from "@stackra/support";
import { Button, Drawer, Kbd } from "@stackra/ui/react";
import { XMarkIcon } from "@stackra/ui/icons/heroicon/outline";

import { useDevtoolsContext } from "../../hooks/use-devtools-context";
import { useDevtoolsFrameState } from "../../hooks/use-devtools-frame-state";
import { useDevtoolsPanels } from "../../hooks/use-devtools-panels";
import { useDevtoolsSearch } from "../../hooks/use-devtools-search";
import { DevtoolsInspectorToolbar } from "../devtools-inspector-toolbar";
import { DevtoolsNavRail } from "../devtools-nav-rail";
import { DevtoolsPanelEmpty } from "../devtools-panel-empty";
import { DevtoolsPanelFrame } from "../devtools-panel-frame";
import { DevtoolsPositionMenu } from "../devtools-position-menu";
import { DevtoolsSearch } from "../devtools-search";
import type { DevtoolsShellProps } from "./devtools-shell.interface";

/**
 * The main devtools drawer.
 */
export function DevtoolsShell({ className }: DevtoolsShellProps): ReactElement {
  const { state, update } = useDevtoolsFrameState();
  const { analytics, config } = useDevtoolsContext();
  const { panels, find } = useDevtoolsPanels();
  const { query } = useDevtoolsSearch();

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        analytics.shellOpened();
      } else {
        analytics.shellClosed();
      }
      update({ isOpen });
    },
    [analytics, update],
  );

  const handleSelect = useCallback(
    (panelId: string) => {
      update({ activePanelId: panelId });
    },
    [update],
  );

  // Auto-select the first panel when the drawer opens with no
  // active panel — a fresh install would otherwise show an empty
  // viewport until the user clicks something.
  useEffect(() => {
    if (state.isOpen && state.activePanelId === null && panels.length > 0) {
      update({ activePanelId: panels[0]!.id });
    }
  }, [state.isOpen, state.activePanelId, panels, update]);

  const activePanel = state.activePanelId ? find(state.activePanelId) : null;

  // Shortcut label shown in the footer. We render every configured
  // modifier as a separate `Kbd.Abbr` so the visual matches the
  // OS-native key layout.
  const shortcutLabel = renderShortcutLabel(config.shortcut);

  return (
    <Drawer>
      <Drawer.Backdrop isOpen={state.isOpen} onOpenChange={handleOpenChange}>
        <Drawer.Content placement={state.position}>
          <Drawer.Dialog
            className={className ?? "flex h-full w-full flex-col overflow-hidden md:w-[520px]"}
            data-devtools-shell=""
          >
            <Drawer.CloseTrigger />
            <Drawer.Header className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Drawer.Heading>Devtools</Drawer.Heading>
                <div className="min-w-0 flex-1">
                  <DevtoolsSearch />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <DevtoolsInspectorToolbar />
                <DevtoolsPositionMenu />
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  aria-label="Close devtools"
                  onPress={() => handleOpenChange(false)}
                >
                  <XMarkIcon aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex min-h-0 flex-1 flex-row p-0">
              <DevtoolsNavRail
                activePanelId={state.activePanelId}
                onSelect={handleSelect}
                searchQuery={query}
              />
              <div className="min-w-0 flex-1">
                {activePanel ? <DevtoolsPanelFrame panel={activePanel} /> : <DevtoolsPanelEmpty />}
              </div>
            </Drawer.Body>
            <Drawer.Footer className="border-border text-muted flex items-center justify-between border-t px-4 py-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span>Toggle</span>
                {shortcutLabel}
              </span>
              <span className="tabular-nums">{panels.length} panels</span>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

/**
 * Render the shortcut label as a set of `Kbd.Abbr` chips.
 * Returns `null` when the shortcut is disabled.
 */
function renderShortcutLabel(
  shortcut: ReturnType<typeof useDevtoolsContext>["config"]["shortcut"],
): ReactElement | null {
  if (!shortcut) return null;
  const parts: string[] = [];
  if (shortcut.meta) parts.push("Meta");
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  parts.push(Str.upper(shortcut.key));
  return (
    <Kbd>
      <Kbd.Content>{parts.join(" + ")}</Kbd.Content>
    </Kbd>
  );
}
