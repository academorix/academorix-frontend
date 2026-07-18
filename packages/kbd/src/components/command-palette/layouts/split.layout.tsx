/**
 * @fileoverview SplitPaletteLayout — split-view with command list + preview panel.
 *
 * @module @stackra/kbd
 * @category Components
 */
import { useState, type ReactElement } from "react";
import { Chip, Kbd } from "@stackra/ui/react";
import { Command } from "@stackra/ui/react";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import { formatCombo } from "../../../utils/format-combo.util";
import { useI18n } from "@stackra/i18n/react";
import type { LayoutProps } from "./layout-props.interface";
import { InputBar, Empty, ResultCount } from "./shared";

/** Split-view layout with command list on the left and preview on the right. */
export function SplitPaletteLayout({
  isOpen,
  query,
  commands,
  isLoading,
  service,
  placeholder,
  emptyMessage,
  emptyHint,
  size,
  backdrop,
  types,
  grouped,
}: LayoutProps): ReactElement {
  const { t } = useI18n();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focused = commands.find((c) => c.id === focusedId) ?? commands[0] ?? null;

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        variant={backdrop}
        onOpenChange={(o) => {
          if (!o) service.close();
        }}
      >
        <Command.Container size={size}>
          <Command.Dialog inputValue={query} onInputChange={(v) => service.setQuery(v)}>
            <InputBar placeholder={placeholder} isLoading={isLoading} />
            <div className="flex min-h-[300px] divide-x divide-default-200">
              {/* Left panel — command list */}
              <div className="w-[40%] overflow-y-auto">
                <Command.List
                  renderEmptyState={() => <Empty msg={emptyMessage} hint={emptyHint} />}
                  onAction={async (key) => {
                    setFocusedId(key as string);
                    const c = commands.find((x: CommandItem) => x.id === key);
                    if (c) await service.invoke(c);
                  }}
                >
                  {Array.from(grouped.entries()).map(([typeId, items]) => (
                    <Command.Group key={typeId} heading={types.resolve(typeId).label}>
                      {items.map((cmd) => (
                        <Command.Item
                          key={cmd.id}
                          id={cmd.id}
                          textValue={cmd.label}
                          isDisabled={cmd.disabled}
                        >
                          {cmd.icon && (
                            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
                              {cmd.icon}
                            </span>
                          )}
                          <div className="flex flex-1 flex-col min-w-0">
                            <span className="truncate text-sm font-medium text-foreground">
                              {cmd.label}
                            </span>
                            {cmd.description && (
                              <span className="truncate text-xs text-default-500">
                                {cmd.description}
                              </span>
                            )}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>
              </div>
              {/* Right panel — preview */}
              <div className="w-[60%] flex flex-col items-center justify-center p-6 text-center">
                {focused ? (
                  <div className="flex flex-col items-center gap-3">
                    {focused.icon && (
                      <span className="grid size-12 place-items-center rounded-lg bg-accent/10 text-accent">
                        {focused.icon}
                      </span>
                    )}
                    <p className="text-base font-semibold text-foreground">{focused.label}</p>
                    {focused.description && (
                      <p className="text-sm text-default-500">{focused.description}</p>
                    )}
                    {focused.shortcut && (
                      <Kbd className="text-xs">
                        <Kbd.Content>{formatCombo(focused.shortcut)}</Kbd.Content>
                      </Kbd>
                    )}
                    {focused.type && (
                      <Chip size="sm" variant="tertiary">
                        {focused.type}
                      </Chip>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-default-400">
                    {t("kbd.components.command_palette.select_a_command")}
                  </p>
                )}
              </div>
            </div>
            <Command.Footer className="justify-end">
              <ResultCount count={commands.length} />
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
