/**
 * @fileoverview useCommand — register a command for the lifetime of a component.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useEffect, useId } from "react";
import { useInject } from "@stackra/container/react";

import { COMMAND_REGISTRY } from "../../tokens";
import type { Command } from "../../interfaces/command.interface";
import type { CommandRegistry } from "../../registries/command.registry";

/**
 * Register a command-palette entry for the lifetime of the calling
 * component.
 *
 * @param command - Command definition (id is optional).
 *
 * @example
 * ```tsx
 * useCommand({
 *   label: "Toggle dark mode",
 *   keywords: ["theme", "appearance"],
 *   type: "tool",
 *   handler: ({ close }) => { toggleTheme(); close(); },
 * });
 * ```
 */
export function useCommand(command: Omit<Command, "id"> & { id?: string }): void {
  const registry = useInject<CommandRegistry>(COMMAND_REGISTRY);
  const fallbackId = useId();
  const id = command.id ?? `useCommand::${fallbackId}`;

  useEffect(() => {
    registry.registerCommand({ ...command, id } as Command);
    return () => registry.unregisterCommand(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    command.label,
    command.description,
    "handler" in command ? command.handler : undefined,
    "to" in command ? command.to : undefined,
    command.disabled,
    command.type,
    JSON.stringify(command.keywords),
    JSON.stringify(command.shortcut),
  ]);
}
