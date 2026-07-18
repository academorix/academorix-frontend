/**
 * @fileoverview CleanPaletteLayout — nested page navigation with breadcrumbs.
 *
 * @module @stackra/kbd
 * @category Components
 */
import { useState, type ReactElement } from "react";
import { Chip } from "@stackra/ui/react";
import { Command } from "@stackra/ui/react";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import { formatCombo } from "../../../utils/format-combo.util";
import type { LayoutProps } from "./layout-props.interface";
import { InputBar, Empty, FooterHints, ResultCount } from "./shared";

/** Clean layout with page navigation and breadcrumb chips. */
export function CleanPaletteLayout({
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
  grouped,
  types,
}: LayoutProps): ReactElement {
  const [pages, setPages] = useState<string[]>([]);
  const currentPage = pages[pages.length - 1] ?? null;
  const visibleGrouped = currentPage
    ? new Map([[currentPage, grouped.get(currentPage) ?? []]])
    : grouped;

  function handleInput(value: string): void {
    if (value === "" && query.length === 1 && pages.length > 0) setPages((p) => p.slice(0, -1));
    service.setQuery(value);
  }

  return (
    <Command>
      <Command.Backdrop
        isOpen={isOpen}
        variant={backdrop}
        onOpenChange={(o) => {
          if (!o) {
            service.close();
            setPages([]);
          }
        }}
      >
        <Command.Container size={size}>
          <Command.Dialog inputValue={query} onInputChange={handleInput}>
            {pages.length > 0 && (
              <Command.Header>
                <div className="flex items-center gap-1">
                  {pages.map((page) => (
                    <Chip
                      key={page}
                      size="sm"
                      variant="tertiary"
                      className="cursor-pointer"
                      onClick={() => setPages((p) => p.slice(0, p.indexOf(page) + 1))}
                    >
                      {page}
                    </Chip>
                  ))}
                </div>
              </Command.Header>
            )}
            <InputBar placeholder={placeholder} isLoading={isLoading} />
            <Command.List
              renderEmptyState={() => <Empty msg={emptyMessage} hint={emptyHint} />}
              onAction={async (key) => {
                const c = commands.find((x: CommandItem) => x.id === key);
                if (c) {
                  if (c.type && !currentPage) setPages((p) => [...p, c.type!]);
                  else await service.invoke(c);
                }
              }}
            >
              {Array.from(visibleGrouped.entries()).map(([typeId, items]) => (
                <Command.Group key={typeId} heading={types.resolve(typeId).label}>
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      id={cmd.id}
                      textValue={cmd.label}
                      isDisabled={cmd.disabled}
                    >
                      <span className="flex-1 truncate text-sm text-foreground">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="shrink-0 text-xs text-default-400">
                          {formatCombo(cmd.shortcut)}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
            <Command.Footer className="justify-between [&_kbd]:h-5 [&_kbd]:text-xs">
              <FooterHints />
              <ResultCount count={commands.length} />
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
