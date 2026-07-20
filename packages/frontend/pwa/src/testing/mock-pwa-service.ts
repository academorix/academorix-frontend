/**
 * @file mock-pwa-service.ts
 * @module @stackra/pwa/testing
 * @description In-memory `PwaService`-shaped mock for tests.
 *
 *   Mirrors the public API surface of the real service so React
 *   hooks and consumers register it under `PWA_SERVICE` in test DI
 *   containers as a drop-in.
 */

import { detectDisplayMode, detectIosSafari, detectStandalone } from "@/core/utils";
import type {
  IPwaAttribution,
  IPwaInstallState,
  IPwaSnapshot,
  IPwaUpdateState,
  PwaDisplayMode,
} from "@/core/interfaces";
import type { PwaListener } from "@/core/services";

/**
 * In-memory PWA service for tests.
 *
 * @example
 * ```ts
 * const service = new MockPwaService({
 *   install: {
 *     isSupported: true,
 *     isVisible: true,
 *     isInstalled: false,
 *     isIosSafari: false,
 *     dismissCount: 0,
 *   },
 * });
 * expect(service.getSnapshot().install.isVisible).toBe(true);
 * ```
 */
export class MockPwaService {
  private install: IPwaInstallState;
  private update: IPwaUpdateState;
  private standalone: boolean;
  private displayMode: PwaDisplayMode;
  private attribution: IPwaAttribution;
  private readonly listeners = new Set<PwaListener>();
  private snapshot: IPwaSnapshot;

  public promptInstallResult: boolean = true;
  public promptInstallCalls = 0;
  public dismissCalls = 0;
  public acceptUpdateCalls = 0;
  public dismissUpdateCalls = 0;

  public constructor(initial?: {
    readonly install?: Partial<IPwaInstallState>;
    readonly update?: Partial<IPwaUpdateState>;
    readonly standalone?: boolean;
    readonly displayMode?: PwaDisplayMode;
    readonly attribution?: Partial<IPwaAttribution>;
  }) {
    this.install = {
      isSupported: false,
      isVisible: false,
      isInstalled: false,
      isIosSafari: detectIosSafari(),
      dismissCount: 0,
      ...initial?.install,
    };
    this.update = { isAvailable: false, isVisible: false, ...initial?.update };
    this.standalone = initial?.standalone ?? detectStandalone();
    this.displayMode = initial?.displayMode ?? detectDisplayMode();
    this.attribution = {
      utm: {},
      displayMode: this.displayMode,
      referrer: "",
      isInstalledContext: this.standalone,
      ...initial?.attribution,
    };
    this.snapshot = this.build();
  }

  // ── Reads ─────────────────────────────────────────────────────────────

  public getInstallState(): IPwaInstallState {
    return this.install;
  }
  public getUpdateState(): IPwaUpdateState {
    return this.update;
  }
  public isStandalone(): boolean {
    return this.standalone;
  }
  public getDisplayMode(): PwaDisplayMode {
    return this.displayMode;
  }
  public getAttribution(): IPwaAttribution {
    return this.attribution;
  }
  public getSnapshot(): IPwaSnapshot {
    return this.snapshot;
  }

  // ── Mutations ─────────────────────────────────────────────────────────

  public async promptInstall(): Promise<boolean> {
    this.promptInstallCalls += 1;
    const accepted = this.promptInstallResult;
    this.install = {
      ...this.install,
      isVisible: false,
      isInstalled: accepted || this.install.isInstalled,
    };
    this.emit();
    return accepted;
  }

  public dismissInstallPrompt(): void {
    this.dismissCalls += 1;
    this.install = {
      ...this.install,
      isVisible: false,
      dismissCount: this.install.dismissCount + 1,
    };
    this.emit();
  }

  public resetDismissCount(): void {
    this.install = { ...this.install, dismissCount: 0, isVisible: false };
    this.emit();
  }

  public acceptUpdate(): void {
    this.acceptUpdateCalls += 1;
    this.update = { isAvailable: false, isVisible: false };
    this.emit();
  }

  public dismissUpdate(): void {
    this.dismissUpdateCalls += 1;
    this.update = { ...this.update, isVisible: false };
    this.emit();
  }

  public async requestPersistentStorage(): Promise<boolean> {
    return false;
  }

  public reportOffline(): void {
    // no-op — recorded via the mock analytics client in tests.
  }

  public destroy(): void {
    this.listeners.clear();
  }

  public bindServiceWorker(): void {
    // no-op — real service wires listeners; mock is deliberate.
  }

  // ── Subscription ──────────────────────────────────────────────────────

  public subscribe(listener: PwaListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Force install substate + emit. */
  public simulateInstall(next: Partial<IPwaInstallState>): void {
    this.install = { ...this.install, ...next };
    this.emit();
  }

  /** Force update substate + emit. */
  public simulateUpdate(next: Partial<IPwaUpdateState>): void {
    this.update = { ...this.update, ...next };
    this.emit();
  }

  /** Force standalone flag + emit. */
  public simulateStandalone(next: boolean): void {
    this.standalone = next;
    this.attribution = { ...this.attribution, isInstalledContext: next };
    this.emit();
  }

  /** Force display mode + emit. */
  public simulateDisplayMode(next: PwaDisplayMode): void {
    this.displayMode = next;
    this.attribution = { ...this.attribution, displayMode: next };
    this.emit();
  }

  // ── Private ───────────────────────────────────────────────────────────

  private build(): IPwaSnapshot {
    return {
      install: this.install,
      update: this.update,
      standalone: this.standalone,
      displayMode: this.displayMode,
      attribution: this.attribution,
    };
  }

  private emit(): void {
    this.snapshot = this.build();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }
}
