/**
 * @file kbd-module.test.ts
 * @module @stackra/kbd/tests
 * @description Integration tests for the KbdModule DI bootstrap —
 *   asserts the providers + exports produced by `forRoot` and
 *   `forFeature`. The tests never render components; they only inspect
 *   the DynamicModule shape.
 */
import { describe, it, expect, vi } from "vitest";

// ── Mocks (defined BEFORE the module under test is imported) ──────────────
vi.mock("@heroui-pro/react", () => ({ Command: {} }));
vi.mock("@heroui/react", () => ({
  Chip: () => null,
  Kbd: Object.assign(() => null, { Abbr: () => null, Content: () => null }),
  Button: () => null,
}));
vi.mock("@stackra/i18n/react", () => ({
  __: (key: string) => key,
  useI18n: () => ({ t: (key: string) => key, locale: "en", dir: "ltr" }),
}));
vi.mock("@tanstack/react-hotkeys", () => ({
  HotkeysProvider: ({ children }: { children: unknown }) => children,
  getHotkeyManager: () => ({ register: vi.fn() }),
  getSequenceManager: () => ({ register: vi.fn() }),
  formatForDisplay: vi.fn((s: string) => s),
  useHotkeyRecorder: vi.fn(() => ({
    isRecording: false,
    recordedHotkey: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    cancelRecording: vi.fn(),
  })),
  useHeldKeys: vi.fn(() => []),
  useKeyHold: vi.fn(() => false),
}));

vi.mock("@stackra/container", () => {
  const Global = () => (target: unknown) => target;
  const Module = () => (target: unknown) => target;
  const Injectable = () => (target: unknown) => target;
  const Inject = () => () => {};
  const Optional = () => () => {};
  const registerWith = (
    deps: unknown[],
    factory: (...args: unknown[]) => void,
  ) => ({
    provide: "REGISTER_WITH",
    useFactory: factory,
    inject: deps,
  });

  return { Global, Module, Injectable, Inject, Optional, registerWith };
});

vi.mock("@stackra/logger", () => ({
  Logger: class MockLogger {
    warn = vi.fn();
  },
}));

// ── Module under test + related symbols ───────────────────────────────────
import { KbdModule } from "../../src/kbd.module";
import {
  COMMAND_PALETTE_SERVICE,
  COMMAND_REGISTRY,
  COMMAND_TYPE_REGISTRY,
  KBD_CONFIG,
  KEYBOARD_CATALOG_SERVICE,
  KEYBOARD_HINTS_SERVICE,
  PALETTE_THEME_REGISTRY,
  SHORTCUT_CUSTOMIZATION,
  SHORTCUT_REGISTRY,
} from "../../src/tokens";
import { ShortcutRegistry } from "../../src/registries/shortcut.registry";
import { CommandRegistry } from "../../src/registries/command.registry";
import { CommandTypeRegistry } from "../../src/registries/command-type.registry";
import { PaletteThemeRegistry } from "../../src/registries/palette-theme.registry";
import { CommandPaletteService } from "../../src/services/command-palette.service";
import { KeyboardCatalogService } from "../../src/services/keyboard-catalog.service";
import { KeyboardHintsService } from "../../src/services/keyboard-hints.service";
import { KeyboardListenerService } from "../../src/services/keyboard-listener.service";
import { ShortcutCustomizationService } from "../../src/services/shortcut-customization.service";

/** Provider record helper — the DI module shape lets `provide` be a
 * symbol / class / string, so cast to a wide record for querying. */
type ProviderLike = {
  provide: unknown;
  useClass?: unknown;
  useValue?: unknown;
  useExisting?: unknown;
  useFactory?: unknown;
  inject?: unknown[];
};

describe("KbdModule DI bootstrap", () => {
  // ── forRoot ─────────────────────────────────────────────────────────────

  describe("forRoot", () => {
    it("returns a DynamicModule with correct module reference", () => {
      const result = KbdModule.forRoot();
      expect(result.module).toBe(KbdModule);
    });

    it("marks module as global", () => {
      const result = KbdModule.forRoot();
      expect(result.global).toBe(true);
    });

    it("registers KBD_CONFIG provider with config value", () => {
      const config = { sequenceTimeoutMs: 2000 };
      const result = KbdModule.forRoot(config);
      const configProvider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === KBD_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(configProvider?.useValue).toBe(config);
    });

    it("registers KBD_CONFIG with empty config by default", () => {
      const result = KbdModule.forRoot();
      const configProvider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === KBD_CONFIG,
      );
      expect(configProvider).toBeDefined();
      expect(configProvider?.useValue).toEqual({});
    });

    it("registers ShortcutRegistry as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === ShortcutRegistry,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(ShortcutRegistry);
    });

    it("registers SHORTCUT_REGISTRY as alias to ShortcutRegistry", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === SHORTCUT_REGISTRY,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(ShortcutRegistry);
    });

    it("registers CommandRegistry as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === CommandRegistry,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(CommandRegistry);
    });

    it("registers COMMAND_REGISTRY as alias to CommandRegistry", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === COMMAND_REGISTRY,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(CommandRegistry);
    });

    it("registers CommandTypeRegistry as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === CommandTypeRegistry,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(CommandTypeRegistry);
    });

    it("registers PaletteThemeRegistry as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === PaletteThemeRegistry,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(PaletteThemeRegistry);
    });

    it("registers CommandPaletteService as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === CommandPaletteService,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(CommandPaletteService);
    });

    it("registers KeyboardListenerService as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === KeyboardListenerService,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(KeyboardListenerService);
    });

    it("registers ShortcutCustomizationService as class provider", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === ShortcutCustomizationService,
      );
      expect(provider).toBeDefined();
      expect(provider?.useClass).toBe(ShortcutCustomizationService);
    });

    it("registers SHORTCUT_CUSTOMIZATION as alias to ShortcutCustomizationService", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === SHORTCUT_CUSTOMIZATION,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(ShortcutCustomizationService);
    });

    it("exports all expected tokens", () => {
      const result = KbdModule.forRoot();
      const exports = result.exports!;

      expect(exports).toContain(KBD_CONFIG);
      expect(exports).toContain(ShortcutRegistry);
      expect(exports).toContain(SHORTCUT_REGISTRY);
      expect(exports).toContain(CommandRegistry);
      expect(exports).toContain(COMMAND_REGISTRY);
      expect(exports).toContain(CommandTypeRegistry);
      expect(exports).toContain(COMMAND_TYPE_REGISTRY);
      expect(exports).toContain(PaletteThemeRegistry);
      expect(exports).toContain(PALETTE_THEME_REGISTRY);
      expect(exports).toContain(CommandPaletteService);
      expect(exports).toContain(COMMAND_PALETTE_SERVICE);
      expect(exports).toContain(KeyboardCatalogService);
      expect(exports).toContain(KEYBOARD_CATALOG_SERVICE);
      expect(exports).toContain(KeyboardHintsService);
      expect(exports).toContain(KEYBOARD_HINTS_SERVICE);
      expect(exports).toContain(KeyboardListenerService);
      expect(exports).toContain(ShortcutCustomizationService);
      expect(exports).toContain(SHORTCUT_CUSTOMIZATION);
    });

    it("registers COMMAND_PALETTE_SERVICE as alias", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === COMMAND_PALETTE_SERVICE,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(CommandPaletteService);
    });

    it("registers KEYBOARD_CATALOG_SERVICE as alias", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === KEYBOARD_CATALOG_SERVICE,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(KeyboardCatalogService);
    });

    it("registers KEYBOARD_HINTS_SERVICE as alias", () => {
      const result = KbdModule.forRoot();
      const provider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === KEYBOARD_HINTS_SERVICE,
      );
      expect(provider).toBeDefined();
      expect(provider?.useExisting).toBe(KeyboardHintsService);
    });
  });

  // ── forFeature ──────────────────────────────────────────────────────────

  describe("forFeature", () => {
    it("returns a DynamicModule with correct module reference", () => {
      const result = KbdModule.forFeature({ shortcuts: [] });
      expect(result.module).toBe(KbdModule);
    });

    it("registers providers for feature items", () => {
      const result = KbdModule.forFeature({
        shortcuts: [
          {
            id: "test.shortcut",
            description: "Test",
            combo: { mod: true, key: "t" },
            handler: vi.fn(),
          },
        ],
      });
      expect(result.providers).toBeDefined();
      expect(result.providers!.length).toBeGreaterThan(0);
    });

    it("accepts shortcuts, commands, types, and themes", () => {
      const result = KbdModule.forFeature({
        shortcuts: [
          {
            id: "feat.shortcut",
            description: "Feature shortcut",
            combo: { mod: true, key: "f" },
            handler: vi.fn(),
          },
        ],
        // Test data — the DTO shapes are inspected but not validated by
        // the module itself; the registries handle their own shapes.
        commands: [
          {
            id: "feat.command",
            title: "Feature Command",
            handler: vi.fn(),
          } as unknown as Parameters<
            typeof KbdModule.forFeature
          >[0]["commands"] extends readonly (infer U)[] | undefined
            ? U
            : never,
        ],
        types: [
          { id: "feat-type", label: "Feature Type" } as unknown as Parameters<
            typeof KbdModule.forFeature
          >[0]["types"] extends readonly (infer U)[] | undefined
            ? U
            : never,
        ],
        themes: [
          { id: "feat-theme", name: "Feature Theme" } as unknown as Parameters<
            typeof KbdModule.forFeature
          >[0]["themes"] extends readonly (infer U)[] | undefined
            ? U
            : never,
        ],
      });

      expect(result.module).toBe(KbdModule);
      expect(result.providers).toBeDefined();
    });

    it("returns empty exports array", () => {
      const result = KbdModule.forFeature({ shortcuts: [] });
      expect(result.exports).toEqual([]);
    });

    it("uses registerWith to inject registries", () => {
      const result = KbdModule.forFeature({ shortcuts: [] });
      const registerProvider = (result.providers as ProviderLike[])?.find(
        (p) => p.provide === "REGISTER_WITH",
      );
      expect(registerProvider).toBeDefined();
      expect(registerProvider?.inject).toContain(ShortcutRegistry);
      expect(registerProvider?.inject).toContain(CommandRegistry);
      expect(registerProvider?.inject).toContain(CommandTypeRegistry);
      expect(registerProvider?.inject).toContain(PaletteThemeRegistry);
    });
  });
});
