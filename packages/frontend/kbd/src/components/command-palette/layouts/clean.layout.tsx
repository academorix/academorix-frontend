/**
 * @fileoverview CleanPaletteLayout — nested page navigation with breadcrumbs.
 *
 * @module @stackra/kbd
 * @category Components
 */
import { useState, type ReactElement } from "react";
import { Button, Command } from "@stackra/ui/react";

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
                {/*
                  Breadcrumb-style page navigation — a keyboard-friendly
                  Button per crumb. HeroUI's `Chip` has no `onClick`
                  contract in v3 and no button semantics, which meant
                  keyboard users could not activate a crumb (Round 6
                  UI reviewer P1). `Button variant="tertiary"` gives
                  us the intended small-and-quiet look plus native
                  keyboard activation, focus ring, and a real
                  `role="button"` for screen readers.
                */}
                <div className="flex items-center gap-1">
                  {pages.map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant="tertiary"
                      onPress={() => setPages((p) => p.slice(0, p.indexOf(page) + 1))}
                    >
                      {page}
                    </Button>
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
                      <span className="text-foreground flex-1 truncate text-sm">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="text-default-400 shrink-0 text-xs">
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
