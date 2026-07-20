/**
 * @fileoverview MinimalPaletteLayout — Linear-style text-only with accent bars.
 *
 * @module @stackra/kbd
 * @category Components
 */
import type { ReactElement } from "react";
import { Chip } from "@stackra/ui/react";
import { Command } from "@stackra/ui/react";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import { formatCombo } from "../../../utils/format-combo.util";
import { useI18n } from "@stackra/i18n/react";
import type { LayoutProps } from "./layout-props.interface";
import { InputBar, Empty, FooterHints } from "./shared";

/** Linear-style minimal palette with text-only items and accent bar on focus. */
export function MinimalPaletteLayout({
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
            <Command.Header>
              <Chip size="sm" variant="tertiary">
                {t("kbd.components.command_palette.current_page")}
              </Chip>
            </Command.Header>
            <InputBar placeholder={placeholder} isLoading={isLoading} />
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
                    <Command.Item
                      key={cmd.id}
                      id={cmd.id}
                      textValue={cmd.label}
                      isDisabled={cmd.disabled}
                    >
                      <span className="bg-accent w-[3px] self-stretch rounded-full opacity-0 group-data-focused:opacity-100" />
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
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
