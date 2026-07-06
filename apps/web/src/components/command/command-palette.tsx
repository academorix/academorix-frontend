/**
 * @file command-palette.tsx
 * @module components/command/command-palette
 *
 * @description
 * The global ⌘K command palette rendered at the authenticated shell root.
 * Populated from the module registry (`appResources`) so every module that
 * declares a `list` route becomes a Navigate command and every module that
 * declares a `create` route becomes a Create command. Commands are gated by
 * the identity's features and permissions (same rule set as the sidebar).
 *
 * See `DASHBOARD_UX_PLAN.md` §3.4 and §12 for the design brief. This first
 * iteration ships the Navigate and Create classes; the Search-records and
 * Actions classes land in a follow-up wave.
 */

import { MagnifyingGlassIcon, PlusIcon } from "@academorix/ui/icons/outline";
import { Chip, Command, Kbd } from "@academorix/ui/react";
import { useGetIdentity } from "@refinedev/core";
import { useMemo } from "react";
import { useNavigate } from "react-router";

import type { SidebarGroupKey } from "@/lib/module";
import type { Identity } from "@/types";
import type { Key, ReactNode } from "react";

import { useCommandPalette } from "@/components/command/command-palette-provider";
import { appResources } from "@/lib/module";

/** Fallback label per sidebar group when the tenant has no override. */
const GROUP_LABEL: Record<SidebarGroupKey | "other", string> = {
  overview: "Overview",
  operations: "Operations",
  growth: "Growth",
  finance: "Finance",
  administration: "Administration",
  ai: "AI",
  other: "Other",
};

/** A single command entry rendered inside a group. */
interface PaletteCommand {
  /** Stable key: `navigate:<resource>` or `create:<resource>`. */
  id: string;
  /** Resource label in the tenant's terminology. */
  label: string;
  /** Verb — "Go to" for navigate, "Create" for create. */
  verb: "navigate" | "create";
  /** Route the command sends the user to. */
  route: string;
  /** Group this command belongs to for section-heading rendering. */
  group: SidebarGroupKey | "other";
  /** Optional keyboard shortcut sequence (e.g. `"G A"`). */
  shortcut?: string;
}

/** Whether the identity has the given tenant feature enabled. */
function featureAllowed(identity: Identity | undefined, featureKey?: string): boolean {
  if (!featureKey) {
    return true;
  }

  const features = identity?.features ?? [];

  return features.length === 0 || features.includes(featureKey);
}

/** Whether the identity has the given permission (`"*"` = superuser). */
function permissionAllowed(identity: Identity | undefined, permission?: string): boolean {
  if (!permission) {
    return true;
  }

  const permissions = identity?.permissions ?? [];

  return permissions.includes("*") || permissions.includes(permission);
}

/** Builds the palette command list from the resource registry + identity. */
function buildCommands(identity: Identity | undefined): PaletteCommand[] {
  const commands: PaletteCommand[] = [];

  for (const resource of appResources) {
    const allowed =
      featureAllowed(identity, resource.meta.featureKey) &&
      permissionAllowed(identity, resource.meta.requiredPermission);

    if (!allowed) {
      continue;
    }

    const label = identity?.terminology?.[resource.name] ?? resource.meta.label;
    const group = resource.meta.groupKey ?? "other";

    // Navigate command — needs a list URL.
    if (typeof resource.list === "string") {
      commands.push({
        id: `navigate:${resource.name}`,
        label,
        verb: "navigate",
        route: resource.list,
        group,
        shortcut: resource.meta.shortcuts?.navigate,
      });
    }

    // Create command — needs a create URL.
    if (typeof resource.create === "string") {
      commands.push({
        id: `create:${resource.name}`,
        label,
        verb: "create",
        route: resource.create,
        group,
        shortcut: resource.meta.shortcuts?.create,
      });
    }
  }

  return commands;
}

/** Groups a command list by verb + module group for stable rendering. */
interface CommandGroup {
  key: string;
  heading: string;
  commands: PaletteCommand[];
}

/** Returns the fully-grouped palette content, ordered for display. */
function groupCommands(commands: PaletteCommand[]): CommandGroup[] {
  const buckets = new Map<string, CommandGroup>();

  for (const command of commands) {
    const heading =
      command.verb === "navigate"
        ? `Go to ${GROUP_LABEL[command.group]}`
        : `Create in ${GROUP_LABEL[command.group]}`;
    const key = `${command.verb}:${command.group}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.commands.push(command);
    } else {
      buckets.set(key, { key, heading, commands: [command] });
    }
  }

  // Order: all Navigate groups first (in canonical sidebar order), then all
  // Create groups in the same order. Keeps the palette scannable.
  const order: (SidebarGroupKey | "other")[] = [
    "overview",
    "operations",
    "growth",
    "finance",
    "administration",
    "ai",
    "other",
  ];

  const groups: CommandGroup[] = [];

  for (const verb of ["navigate", "create"] as const) {
    for (const group of order) {
      const entry = buckets.get(`${verb}:${group}`);

      if (entry) {
        groups.push(entry);
      }
    }
  }

  return groups;
}

/**
 * The palette itself. Mount once at the authenticated shell root; the
 * provider owns open state and the global ⌘K handler.
 */
export function CommandPalette(): ReactNode {
  const { isOpen, close } = useCommandPalette();
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();

  const commands = useMemo(() => buildCommands(identity), [identity]);
  const groups = useMemo(() => groupCommands(commands), [commands]);

  // Every command is keyed by `id` (verb:resource). When the palette fires
  // `onAction`, we look up the target and route to it. Closing the palette
  // happens before navigation so React Router does not re-render the palette
  // over the target page.
  const handleAction = (key: Key): void => {
    const command = commands.find((entry) => entry.id === String(key));

    if (!command) {
      return;
    }

    close();
    navigate(command.route);
  };

  return (
    <Command>
      <Command.Backdrop isOpen={isOpen} onOpenChange={(next) => (next ? undefined : close())}>
        <Command.Container size="md">
          <Command.Dialog>
            <Command.InputGroup>
              <Command.InputGroup.Prefix>
                <MagnifyingGlassIcon />
              </Command.InputGroup.Prefix>
              <Command.InputGroup.Input placeholder="Type a command or search…" />
              <Command.InputGroup.ClearButton />
              <Command.InputGroup.Suffix>
                <Kbd className="text-xs">
                  <Kbd.Content>Esc</Kbd.Content>
                </Kbd>
              </Command.InputGroup.Suffix>
            </Command.InputGroup>

            <Command.List onAction={handleAction}>
              {groups.map((group) => (
                <Command.Group key={group.key} heading={group.heading}>
                  {group.commands.map((command) => (
                    <Command.Item
                      key={command.id}
                      id={command.id}
                      textValue={`${command.verb === "create" ? "Create" : "Go to"} ${command.label}`}
                    >
                      {command.verb === "create" ? (
                        <PlusIcon />
                      ) : (
                        <MagnifyingGlassIcon className="opacity-40" />
                      )}
                      <span className="flex-1">
                        {command.verb === "create" ? "Create " : "Go to "}
                        <span className="font-medium">{command.label}</span>
                      </span>
                      {command.shortcut ? (
                        <Chip
                          className="ms-auto text-xs tabular-nums"
                          size="sm"
                          variant="secondary"
                        >
                          <Chip.Label>{command.shortcut}</Chip.Label>
                        </Chip>
                      ) : null}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command.Dialog>
        </Command.Container>
      </Command.Backdrop>
    </Command>
  );
}
