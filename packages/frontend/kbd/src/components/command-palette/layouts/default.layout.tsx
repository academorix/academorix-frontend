/**
 * @fileoverview DefaultPaletteLayout — standard grouped palette with footer hints.
 *
 * @module @stackra/kbd
 * @category Components
 */
import type { ReactElement } from "react";
import { Command } from "@stackra/ui/react";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import type { LayoutProps } from "./layout-props.interface";
import { InputBar, PaletteItem, FooterHints, Empty, ResultCount } from "./shared";

/** Standard command palette with search, grouped results, and footer hints. */
export function DefaultPaletteLayout({
  isOpen,
  query,
  commands,
  isLoading,
  service,
  placeholder,
  emptyMessage,
  emptyHint,
  footerHint,
  size,
  backdrop,
  types,
  grouped,
}: LayoutProps): ReactElement {
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
            <InputBar placeholder={placeholder} isLoading={isLoading} showKbd />
            <Command.List
              renderEmptyState={() => <Empty msg={emptyMessage} hint={emptyHint} />}
              onAction={async (key) => {
                const c = commands.find((x: CommandItem) => x.id === key);
                if (c) await service.invoke(c);
              }}
            >
              {Array.from(grouped.entries()).map(([typeId, items]) => (
                <Command.Group key={typeId} heading={types.resolve(typeId).label}>
                  {items.map((cmd) => (
                    <PaletteItem key={cmd.id} command={cmd} />
                  ))}
                </Command.Group>
              ))}
            </Command.List>
            <Command.Footer className="justify-between [&_kbd]:h-5 [&_kbd]:text-xs">
              {footerHint ?? <FooterHints />}
              <ResultCount count={commands.length} />
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
