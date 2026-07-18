/**
 * @file keyboard-shortcut-sheet.tsx
 * @module components/keyboard-shortcut-sheet
 *
 * @description
 * A discoverability sheet — a HeroUI Modal listing every registered shortcut
 * grouped by verb. Opens on `?`, closes on Escape. Reads shortcuts directly
 * from `appShortcuts` so new module bindings show up here automatically.
 */

import { Button, Modal, useOverlayState } from "@heroui/react";
import { createContext, useContext, useMemo } from "react";

import type { ResolvedShortcut } from "@/modules/registry";
import type { ReactNode } from "react";

import { ShortcutKbd } from "@/lib/kbd";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { appResources, appShortcuts } from "@/modules/registry";
import { useTranslate } from "@/hooks/use-translate";

type SheetContextValue = { isOpen: boolean; open: () => void; close: () => void };

const SheetContext = createContext<SheetContextValue | null>(null);

function resourceLabel(name: string): string {
  return appResources.find((r) => r.name === name)?.meta.label ?? name;
}

type SheetGroup = { key: string; labelKey: string; bindings: ResolvedShortcut[] };

function groupShortcuts(): SheetGroup[] {
  const byAction: Record<ResolvedShortcut["action"], ResolvedShortcut[]> = {
    navigate: [],
    create: [],
    custom: [],
  };

  for (const binding of appShortcuts) byAction[binding.action].push(binding);

  return [
    { key: "navigate", labelKey: "shortcuts.category.navigate", bindings: byAction.navigate },
    { key: "create", labelKey: "shortcuts.category.create", bindings: byAction.create },
    { key: "actions", labelKey: "shortcuts.category.actions", bindings: byAction.custom },
  ].filter((section) => section.bindings.length > 0);
}

function KeyboardShortcutSheet({ state }: { state: ReturnType<typeof useOverlayState> }) {
  const t = useTranslate();
  const groups = useMemo(() => groupShortcuts(), []);

  const rowLabel = (binding: ResolvedShortcut): string => {
    const label = resourceLabel(binding.resourceName);

    if (binding.action === "navigate")
      return t("command.verb.navigate", { label }, `Go to ${label}`);
    if (binding.action === "create") return t("command.verb.create", { label }, `Create ${label}`);

    return `${label} · ${binding.verbId}`;
  };

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-xl" data-testid="keyboard-shortcut-sheet">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{t("shortcuts.title", undefined, "Keyboard shortcuts")}</Modal.Heading>
            <p className="mt-1 text-sm text-muted">
              {t("shortcuts.hint", undefined, "Press ? anywhere to open this sheet.")}
            </p>
          </Modal.Header>
          <Modal.Body className="max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section key={group.key} className="flex flex-col gap-2">
                  <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
                    {t(group.labelKey, undefined, group.key)}
                  </h3>
                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {group.bindings.map((binding) => (
                      <li
                        key={`${binding.resourceName}:${binding.action}:${binding.verbId ?? "-"}`}
                        className="flex items-center justify-between gap-4 px-3 py-2.5"
                      >
                        <span className="truncate text-sm text-foreground">
                          {rowLabel(binding)}
                        </span>
                        {/*
                         * WHY ShortcutKbd (not a raw Kbd.Content): the
                         * shared renderer parses the sequence and emits
                         * `Kbd.Abbr` for modifiers so ⌘/⌥/⇧ pick the
                         * correct glyph per OS without any conditional
                         * wiring at the call site.
                         */}
                        <ShortcutKbd className="shrink-0" shortcut={binding.keys} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {groups.length === 0 ? (
                <p className="text-sm text-muted">No shortcuts registered yet.</p>
              ) : null}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close">Close</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export function KeyboardShortcutSheetProvider({ children }: { children: ReactNode }) {
  const state = useOverlayState();

  useKeyboardShortcut("?", (event) => {
    event.preventDefault();
    state.open();
  });

  const value = useMemo<SheetContextValue>(
    () => ({ isOpen: state.isOpen, open: state.open, close: state.close }),
    [state.isOpen, state.open, state.close],
  );

  return (
    <SheetContext.Provider value={value}>
      {children}
      <KeyboardShortcutSheet state={state} />
    </SheetContext.Provider>
  );
}

export function useKeyboardShortcutSheet(): SheetContextValue {
  const ctx = useContext(SheetContext);

  if (!ctx)
    throw new Error(
      "useKeyboardShortcutSheet must be used inside <KeyboardShortcutSheetProvider>.",
    );

  return ctx;
}
