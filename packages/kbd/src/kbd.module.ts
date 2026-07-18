/**
 * @fileoverview KbdModule — DI module for the keyboard / command system.
 *
 * @module @stackra/kbd
 */

import { Global, Module, type DynamicModule, registerWith } from "@stackra/container";

import {
  COMMAND_PALETTE_SERVICE,
  COMMAND_PALETTE_STORE,
  COMMAND_REGISTRY,
  COMMAND_TYPE_REGISTRY,
  KBD_CONFIG,
  KEYBOARD_CATALOG_SERVICE,
  KEYBOARD_CATALOG_STORE,
  KEYBOARD_HINTS_SERVICE,
  KEYBOARD_HINTS_STORE,
  PALETTE_THEME_REGISTRY,
  SHORTCUT_CUSTOMIZATION,
  SHORTCUT_REGISTRY,
} from "./tokens";
import { StateModule } from "@stackra/state";
import type { Command, CommandSource } from "./interfaces/command.interface";
import type { CommandType } from "./interfaces/command-type.interface";
import type { KbdModuleOptions } from "./interfaces/kbd-config.interface";
import type { PaletteTheme } from "./interfaces/palette-theme.interface";
import type { Shortcut } from "./interfaces/shortcut.interface";
import { CommandRegistry } from "./registries/command.registry";
import { CommandTypeRegistry } from "./registries/command-type.registry";
import { PaletteThemeRegistry } from "./registries/palette-theme.registry";
import { ShortcutRegistry } from "./registries/shortcut.registry";
import { CommandPaletteService } from "./services/command-palette.service";
import { KeyboardCatalogService } from "./services/keyboard-catalog.service";
import { KeyboardHintsService } from "./services/keyboard-hints.service";
import { KeyboardListenerService } from "./services/keyboard-listener.service";
import { ShortcutCustomizationService } from "./services/shortcut-customization.service";
/**
 * KbdModule — wires the keyboard subsystem.
 *
 * Uses TanStack Hotkeys as the core engine for key detection and
 * matching, with the application layer (command palette, registry,
 * scopes, customization) built on top.
 */
@Global()
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: Module pattern requires static methods.
export class KbdModule {
  /**
   * Configure the kbd module.
   *
   * @param config - Optional runtime configuration.
   */
  public static forRoot(config: KbdModuleOptions = {}): DynamicModule {
    return {
      module: KbdModule,
      global: true,
      imports: [
        StateModule.forFeature([
          {
            name: "command-palette",
            token: COMMAND_PALETTE_STORE,
            initialState: {
              isOpen: false,
              query: "",
              commands: [],
              isLoading: false,
              themeId: config.defaultPaletteTheme ?? "default",
            },
            crossTab: true,
          },
          {
            name: "keyboard-catalog",
            token: KEYBOARD_CATALOG_STORE,
            initialState: { isOpen: false, activeTab: "shortcuts", query: "" },
            crossTab: true,
          },
          {
            name: "keyboard-hints",
            token: KEYBOARD_HINTS_STORE,
            initialState: { visible: false },
            crossTab: false,
          },
        ]),
      ],
      providers: [
        { provide: KBD_CONFIG, useValue: config },
        { provide: ShortcutRegistry, useClass: ShortcutRegistry },
        { provide: SHORTCUT_REGISTRY, useExisting: ShortcutRegistry },
        { provide: CommandRegistry, useClass: CommandRegistry },
        { provide: COMMAND_REGISTRY, useExisting: CommandRegistry },
        { provide: CommandTypeRegistry, useClass: CommandTypeRegistry },
        { provide: COMMAND_TYPE_REGISTRY, useExisting: CommandTypeRegistry },
        { provide: PaletteThemeRegistry, useClass: PaletteThemeRegistry },
        { provide: PALETTE_THEME_REGISTRY, useExisting: PaletteThemeRegistry },
        // ── Services ──────────────────────────────────────────────────────
        { provide: CommandPaletteService, useClass: CommandPaletteService },
        { provide: COMMAND_PALETTE_SERVICE, useExisting: CommandPaletteService },
        { provide: KeyboardCatalogService, useClass: KeyboardCatalogService },
        { provide: KEYBOARD_CATALOG_SERVICE, useExisting: KeyboardCatalogService },
        { provide: KeyboardHintsService, useClass: KeyboardHintsService },
        { provide: KEYBOARD_HINTS_SERVICE, useExisting: KeyboardHintsService },
        { provide: KeyboardListenerService, useClass: KeyboardListenerService },
        { provide: ShortcutCustomizationService, useClass: ShortcutCustomizationService },
        { provide: SHORTCUT_CUSTOMIZATION, useExisting: ShortcutCustomizationService },
      ],
      exports: [
        KBD_CONFIG,
        ShortcutRegistry,
        SHORTCUT_REGISTRY,
        CommandRegistry,
        COMMAND_REGISTRY,
        CommandTypeRegistry,
        COMMAND_TYPE_REGISTRY,
        PaletteThemeRegistry,
        PALETTE_THEME_REGISTRY,
        COMMAND_PALETTE_STORE,
        KEYBOARD_CATALOG_STORE,
        KEYBOARD_HINTS_STORE,
        CommandPaletteService,
        COMMAND_PALETTE_SERVICE,
        KeyboardCatalogService,
        KEYBOARD_CATALOG_SERVICE,
        KeyboardHintsService,
        KEYBOARD_HINTS_SERVICE,
        KeyboardListenerService,
        ShortcutCustomizationService,
        SHORTCUT_CUSTOMIZATION,
      ],
    };
  }

  /**
   * Register additional shortcuts, commands, sources, types, or themes.
   */
  public static forFeature(items: {
    shortcuts?: Shortcut[];
    commands?: Command[];
    sources?: CommandSource[];
    types?: CommandType[];
    themes?: PaletteTheme[];
  }): DynamicModule {
    return {
      module: KbdModule,
      providers: [
        registerWith<
          [ShortcutRegistry, CommandRegistry, CommandTypeRegistry, PaletteThemeRegistry]
        >(
          [ShortcutRegistry, CommandRegistry, CommandTypeRegistry, PaletteThemeRegistry],
          (shortcutRegistry, commandRegistry, typeRegistry, themeRegistry) => {
            for (const t of items.types ?? []) typeRegistry.registerType(t);
            for (const th of items.themes ?? []) themeRegistry.registerTheme(th);
            for (const s of items.shortcuts ?? []) shortcutRegistry.registerShortcut(s);
            for (const c of items.commands ?? []) commandRegistry.registerCommand(c);
            for (const src of items.sources ?? []) commandRegistry.registerSource(src);
          },
        ),
      ],
      exports: [],
    };
  }
}
