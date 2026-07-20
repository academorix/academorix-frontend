/**
 * @fileoverview LauncherPaletteLayout — Raycast-style flat list with app icons.
 *
 * @module @stackra/kbd
 * @category Components
 */
import type { ReactElement } from "react";
import { Command } from "@stackra/ui/react";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import { useI18n } from "@stackra/i18n/react";
import type { LayoutProps } from "./layout-props.interface";
import { InputBar, Empty, AppIcon } from "./shared";

/** Raycast-style launcher with large app icons and flat list. */
export function LauncherPaletteLayout({
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
            <InputBar placeholder={placeholder} isLoading={isLoading} />
            <Command.List
              renderEmptyState={() => <Empty msg={emptyMessage} hint={emptyHint} />}
              onAction={async (key) => {
                const c = commands.find((x: CommandItem) => x.id === key);
                if (c) await service.invoke(c);
              }}
            >
              {commands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  id={cmd.id}
                  textValue={cmd.label}
                  isDisabled={cmd.disabled}
                >
                  <span className="bg-accent/10 text-accent grid size-10 shrink-0 place-items-center rounded-lg">
                    {cmd.icon ?? <AppIcon />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-foreground truncate text-sm font-medium">
                      {cmd.label}
                    </span>
                    {cmd.description && (
                      <span className="text-default-500 truncate text-xs">{cmd.description}</span>
                    )}
                  </div>
                  <span className="text-default-400 shrink-0 text-xs">
                    {cmd.type === "application"
                      ? t("kbd.components.command_palette.application")
                      : t("kbd.components.command_palette.command")}
                  </span>
                </Command.Item>
              ))}
            </Command.List>
            <Command.Footer className="justify-between">
              <div className="text-default-500 flex items-center gap-3 text-xs">
                <span>{t("kbd.components.command_palette.open_application")} ↵</span>
                <span>{t("kbd.components.command_palette.actions")} ⌘K</span>
              </div>
            </Command.Footer>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
