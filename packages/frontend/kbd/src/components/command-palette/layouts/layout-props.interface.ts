/**
 * @fileoverview Shared layout props interface for command palette variants.
 *
 * @module @stackra/kbd
 * @category Components
 */
import type { ReactNode } from "react";

import type { useCommandPalette } from "../../../hooks/use-command-palette/use-command-palette.hook";
import type { Command as CommandItem } from "../../../interfaces/command.interface";
import type { CommandTypeRegistry } from "../../../registries/command-type.registry";

/** Shared context passed to every layout variant. */
export interface LayoutProps {
  isOpen: boolean;
  query: string;
  commands: CommandItem[];
  isLoading: boolean;
  service: ReturnType<typeof useCommandPalette>["service"];
  placeholder: string;
  emptyMessage: string;
  emptyHint: string;
  footerHint?: ReactNode;
  size: "sm" | "md" | "lg";
  backdrop: "transparent" | "opaque" | "blur";
  types: CommandTypeRegistry;
  grouped: Map<string, CommandItem[]>;
}
