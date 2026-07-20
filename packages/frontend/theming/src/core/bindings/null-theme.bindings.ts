/**
 * @file null-theme.bindings.ts
 * @module @stackra/theming/bindings
 * @description Default IThemeBindings implementation that throws on every call.
 *   Platform modules (WebThemingModule, NativeThemingModule) override this.
 */

import { Injectable } from "@stackra/container";
import type {
  IThemeBindings,
  ColorMode,
  ResolvedMode,
  IDesignTokenMap,
  ISSRScriptOptions,
} from "@stackra/contracts";
import { ThemeBindingsNotConfiguredError } from "../errors";

// ============================================================================
// Null Bindings
// ============================================================================

/**
 * Default IThemeBindings implementation.
 *
 * Every method throws `ThemeBindingsNotConfiguredError`.
 * Platform modules (`WebThemingModule`, `NativeThemingModule`) override
 * this with `useClass` in their `forRoot()`.
 */
@Injectable()
export class NullThemeBindings implements IThemeBindings {
  /** @throws ThemeBindingsNotConfiguredError always. */
  public getPersistedMode(): ColorMode | null {
    throw new ThemeBindingsNotConfiguredError("getPersistedMode");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public setPersistedMode(_mode: ColorMode): void {
    throw new ThemeBindingsNotConfiguredError("setPersistedMode");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public getPersistedTheme(): string | null {
    throw new ThemeBindingsNotConfiguredError("getPersistedTheme");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public setPersistedTheme(_id: string): void {
    throw new ThemeBindingsNotConfiguredError("setPersistedTheme");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public getSystemColorScheme(): ResolvedMode {
    throw new ThemeBindingsNotConfiguredError("getSystemColorScheme");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public subscribeToSystemChanges(_listener: (mode: ResolvedMode) => void): () => void {
    throw new ThemeBindingsNotConfiguredError("subscribeToSystemChanges");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public applyColorMode(_resolvedMode: ResolvedMode): void {
    throw new ThemeBindingsNotConfiguredError("applyColorMode");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public applyTokens(_tokens: IDesignTokenMap): void {
    throw new ThemeBindingsNotConfiguredError("applyTokens");
  }

  /** @throws ThemeBindingsNotConfiguredError always. */
  public getSSRScript(_options: ISSRScriptOptions): string {
    throw new ThemeBindingsNotConfiguredError("getSSRScript");
  }
}
