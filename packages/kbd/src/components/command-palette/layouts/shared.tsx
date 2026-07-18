/**
 * @fileoverview Shared sub-components used across command palette variants.
 *
 * @module @stackra/kbd
 * @category Components
 */
import type { ReactElement } from "react";
import { Chip, Kbd } from "@stackra/ui/react";
import { Command } from "@stackra/ui/react";
import { Str } from "@stackra/support";

import type { Command as CommandItem } from "../../../interfaces/command.interface";
import { formatCombo } from "../../../utils/format-combo.util";
import { useI18n } from "@stackra/i18n/react";

/* ── Input Bar ─────────────────────────────────────────────────── */

export function InputBar({
  placeholder,
  isLoading,
  showKbd,
}: {
  placeholder: string;
  isLoading: boolean;
  showKbd?: boolean;
}): ReactElement {
  return (
    <Command.InputGroup>
      <Command.InputGroup.Prefix>
        <SearchIcon />
      </Command.InputGroup.Prefix>
      <Command.InputGroup.Input placeholder={placeholder} />
      <Command.InputGroup.ClearButton />
      <Command.InputGroup.Suffix>
        {isLoading ? (
          <Spinner />
        ) : showKbd ? (
          <Kbd className="text-[11px]">
            <Kbd.Abbr keyValue="command" />
            <Kbd.Content>K</Kbd.Content>
          </Kbd>
        ) : null}
      </Command.InputGroup.Suffix>
    </Command.InputGroup>
  );
}

/* ── PaletteItem (default variant) ─────────────────────────────── */

export function PaletteItem({ command }: { command: CommandItem }): ReactElement {
  const tags = (command.tags ?? []) as unknown as readonly string[];
  const isDanger = tags.includes("danger");
  const entity = command.meta?.entity as string | undefined;
  return (
    <Command.Item id={command.id} textValue={command.label} isDisabled={command.disabled}>
      {command.icon && (
        <span
          className={[
            "grid size-8 shrink-0 place-items-center rounded-medium",
            isDanger
              ? "bg-danger/10 text-danger"
              : "bg-default-100 text-default-700 dark:bg-default-50",
          ].join(" ")}
        >
          {command.icon}
        </span>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className={["truncate", isDanger ? "text-danger" : "text-foreground"].join(" ")}>
            {command.label}
          </span>
          {tags.map((tag) => (
            <Chip key={tag} size="sm" variant="primary" color={resolveTagColor(tag)}>
              {Str.upper(tag)}
            </Chip>
          ))}
        </span>
        {command.description && (
          <span className="truncate text-xs text-default-500">{command.description}</span>
        )}
      </div>
      {entity && (
        <Chip size="sm" variant="tertiary" className="shrink-0">
          {entity}
        </Chip>
      )}
      {command.shortcut && (
        <Kbd className="ms-auto shrink-0 text-xs">
          <Kbd.Content>{formatCombo(command.shortcut)}</Kbd.Content>
        </Kbd>
      )}
    </Command.Item>
  );
}

/* ── Footer Hints ──────────────────────────────────────────────── */

export function FooterHints(): ReactElement {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Kbd className="text-xs">
            <Kbd.Abbr keyValue="up" />
          </Kbd>
          <Kbd className="text-xs">
            <Kbd.Abbr keyValue="down" />
          </Kbd>
        </div>
        <span>{t("kbd.components.command_palette.navigate")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd className="text-xs">
          <Kbd.Abbr keyValue="enter" />
        </Kbd>
        <span>{t("kbd.components.command_palette.open")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd className="text-xs">
          <Kbd.Content>Esc</Kbd.Content>
        </Kbd>
        <span>{t("kbd.components.command_palette.close")}</span>
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────────── */

export function Empty({ msg, hint }: { msg: string; hint: string }): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full bg-default-100 text-default-500"
      >
        <SearchIcon />
      </span>
      <p className="text-sm font-medium text-foreground">{msg}</p>
      <p className="text-xs text-default-500">{hint}</p>
    </div>
  );
}

/* ── Result Count ──────────────────────────────────────────────── */

export function ResultCount({ count }: { count: number }): ReactElement {
  const { t } = useI18n();
  const label =
    count === 1
      ? t("kbd.palette.result_count_one", { count })
      : t("kbd.palette.result_count_other", { count });

  return <span className="tabular-nums text-xs text-default-500">{label}</span>;
}

/* ── Spinner ───────────────────────────────────────────────────── */

export function Spinner(): ReactElement {
  return (
    <span className="size-4 animate-spin rounded-full border-2 border-default-300 border-t-transparent" />
  );
}

/* ── Icons ─────────────────────────────────────────────────────── */

export function SearchIcon(): ReactElement {
  return (
    <svg
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

export function AppIcon(): ReactElement {
  return (
    <svg
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */

export function groupByType(commands: CommandItem[]): Map<string, CommandItem[]> {
  const groups = new Map<string, CommandItem[]>();
  for (const command of commands) {
    const key = command.type ?? command.category ?? "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(command);
  }
  return groups;
}

function resolveTagColor(tag: string): "default" | "success" | "warning" | "danger" | "accent" {
  switch (Str.lower(tag)) {
    case "new":
      return "success";
    case "hot":
      return "warning";
    case "danger":
      return "danger";
    case "external":
      return "accent";
    default:
      return "default";
  }
}
