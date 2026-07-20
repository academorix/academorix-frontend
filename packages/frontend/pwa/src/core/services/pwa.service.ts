/**
 * @file pwa.service.ts
 * @module @stackra/pwa/core/services
 * @description Singleton store for every observable PWA state field —
 *   install prompt, service-worker update, standalone / display mode,
 *   and install-source attribution.
 *
 *   Copies the shape of `@stackra/scope`'s `ScopeService`: a
 *   referentially stable snapshot swapped on every `emit()`, plus a
 *   `subscribe(listener)` observer. Together they satisfy React's
 *   `useSyncExternalStore` contract for tearing-free reads under
 *   concurrent React.
 *
 *   SSR-safety is enforced through per-call `typeof window !==
 *   'undefined'` guards — the service constructs safely in Node
 *   contexts and every read returns a defaulted snapshot.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import type { OnModuleInit } from '@stackra/contracts';
import { optional, tap } from '@stackra/support';

import { PWA_CONFIG, PWA_EVENTS } from '../constants';
import {
  detectDisplayMode,
  detectIosSafari,
  detectStandalone,
  parseUtmParams,
  requestPersistentStorage,
} from '../utils';
import type {
  IPwaAttribution,
  IPwaInstallState,
  IPwaModuleOptions,
  IPwaSnapshot,
  IPwaUpdateState,
  PwaDisplayMode,
} from '../interfaces';
import { AnalyticsBridgeService } from './analytics-bridge.service';

/**
 * Extension of the `Event` shape for the browser's install prompt.
 *
 * The type isn't in the standard lib.dom yet — Chromium fires it as
 * `BeforeInstallPromptEvent` and we cast to this narrower shape.
 */
export interface IBeforeInstallPromptEvent extends Event {
  /** Show the browser's install UI. Resolves once the user picks. */
  prompt(): Promise<void>;
  /** User's decision. */
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

/** Listener signature — receives no argument. */
export type PwaListener = () => void;

/**
 * PWA singleton store.
 *
 * @example
 * ```typescript
 * const pwa = app.get(PWA_SERVICE);
 * const off = pwa.subscribe(() => render());
 * const { install, update, standalone } = pwa.getSnapshot();
 * ```
 */
@Injectable()
export class PwaService implements OnModuleInit {
  // ── State fields ──────────────────────────────────────────────────────

  /** Install prompt state. */
  private install: IPwaInstallState;
  /** Service-worker update state. */
  private update: IPwaUpdateState;
  /** Whether the app is running as an installed PWA. */
  private standalone: boolean;
  /** Coarse display-mode categorisation. */
  private displayMode: PwaDisplayMode;
  /** Install-source attribution. */
  private attribution: IPwaAttribution;

  /** Deferred `beforeinstallprompt` event — resolved lazily on `promptInstall`. */
  private deferredPrompt: IBeforeInstallPromptEvent | null = null;

  /** Cached service-worker registration — populated by `bindServiceWorker`. */
  private registration: ServiceWorkerRegistration | null = null;

  /** Poll interval handle for periodic `registration.update()` — cleared on `destroy`. */
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  /** Cleanup handles for window listeners. */
  private readonly cleanups: Array<() => void> = [];

  /** Registered snapshot listeners. */
  private readonly listeners = new Set<PwaListener>();

  /** Cached referentially stable snapshot — swapped only on `emit()`. */
  private snapshot: IPwaSnapshot;

  public constructor(
    @Inject(PWA_CONFIG) private readonly config: IPwaModuleOptions,
    // Bridge is optional so consumers without analytics wired can still
    // resolve PwaService — it just skips every dispatch.
    @Optional() private readonly analytics?: AnalyticsBridgeService
  ) {
    // Detect the display + standalone state at construction so first
    // paint reads correctly even without a subscribe. SSR-safe:
    // `detectDisplayMode` returns `'browser'` when `window` is absent.
    this.displayMode = detectDisplayMode();
    this.standalone = detectStandalone();
    this.attribution = this.buildAttribution();
    this.install = {
      isSupported: false,
      isVisible: false,
      isInstalled: this.standalone,
      isIosSafari: detectIosSafari(),
      dismissCount: this.readDismissCount(),
    };
    this.update = { isAvailable: false, isVisible: false };
    this.snapshot = this.buildSnapshot();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /**
   * Bind listeners + service-worker registration + optional persistent
   * storage on module init.
   *
   * SSR-safe: every guarded on `typeof window !== 'undefined'`.
   */
  public async onModuleInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1) Emit `standalone.launched` if we booted directly into an
    //    installed context (matters for first-run funnels).
    if (this.standalone) {
      this.analytics?.emit(PWA_EVENTS.STANDALONE_LAUNCHED, {
        displayMode: this.displayMode,
      });
    }

    // 2) Wire the browser's install-prompt event flow.
    this.bindInstallPrompt();

    // 3) Wire display-mode change listener — the user can leave
    //    standalone without navigating (via browser UI on Chrome).
    this.bindDisplayModeWatcher();

    // 4) Optional persistent storage request.
    if (this.config.autoRequestPersistent) {
      // Deliberately not awaited — the prompt is async and blocking
      // the module boot on user permission would be a UX regression.
      void this.requestPersistentStorage();
    }

    // 5) Service-worker binding — best-effort. Consumers wanting more
    //    control call `bindServiceWorker` explicitly with a specific
    //    registration.
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) this.bindServiceWorker(reg);
      } catch {
        // fail-soft — an environment without SW support (or private
        // mode) throws here; the app still works, just without updates.
      }
    }
  }

  // ── Reads ─────────────────────────────────────────────────────────────

  /** Current install state. */
  public getInstallState(): IPwaInstallState {
    return this.install;
  }

  /** Current update state. */
  public getUpdateState(): IPwaUpdateState {
    return this.update;
  }

  /** Whether the app is running standalone. */
  public isStandalone(): boolean {
    return this.standalone;
  }

  /** Current display mode. */
  public getDisplayMode(): PwaDisplayMode {
    return this.displayMode;
  }

  /** Composite install-source attribution. */
  public getAttribution(): IPwaAttribution {
    return this.attribution;
  }

  /**
   * Referentially stable snapshot for `useSyncExternalStore`.
   *
   * Returns the same object identity across calls until `emit()`
   * swaps it — exactly the contract concurrent React expects.
   */
  public getSnapshot(): IPwaSnapshot {
    return this.snapshot;
  }

  // ── Mutations ─────────────────────────────────────────────────────────

  /**
   * Show the browser install prompt.
   *
   * Only meaningful when a `beforeinstallprompt` event has been
   * deferred; otherwise a no-op (returns `false`).
   *
   * @returns `true` when the user accepted; `false` when they
   *   dismissed or when no deferred prompt was available.
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;
    try {
      const promptEvent = this.deferredPrompt;
      // Chrome requires the prompt call to be inside a user-gesture
      // task, which is the caller's responsibility — button `onClick`.
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      const accepted = choice.outcome === 'accepted';
      this.deferredPrompt = null;
      this.updateInstall({
        isSupported: this.install.isSupported,
        isVisible: false,
        isInstalled: accepted || this.install.isInstalled,
        isIosSafari: this.install.isIosSafari,
        dismissCount: this.install.dismissCount,
      });
      this.analytics?.emit(accepted ? PWA_EVENTS.INSTALL_ACCEPTED : PWA_EVENTS.INSTALL_DISMISSED);
      return accepted;
    } catch {
      // fail-soft — Chrome throws if the prompt is called outside a
      // user gesture; nothing we can do at that point.
      return false;
    }
  }

  /**
   * Dismiss the in-app install banner. Increments the dismiss count
   * so `maxDismissals` is respected across page loads.
   */
  public dismissInstallPrompt(): void {
    const next = this.install.dismissCount + 1;
    this.persistDismissCount(next);
    this.updateInstall({
      isSupported: this.install.isSupported,
      isVisible: false,
      isInstalled: this.install.isInstalled,
      isIosSafari: this.install.isIosSafari,
      dismissCount: next,
    });
    this.analytics?.emit(PWA_EVENTS.INSTALL_DISMISSED, { count: next });
  }

  /**
   * Reset the dismiss count — useful in "Ask me again" UI or when
   * the user completes onboarding.
   */
  public resetDismissCount(): void {
    this.persistDismissCount(0);
    this.updateInstall({ ...this.install, dismissCount: 0, isVisible: false });
  }

  /**
   * Accept the pending service-worker update (`SKIP_WAITING` + reload).
   */
  public acceptUpdate(): void {
    // `optional(...)` short-circuits when `registration.waiting` is
    // null — matches the workspace's support-utilities standard.
    const waiting = optional(this.registration).waiting;
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
    this.analytics?.emit(PWA_EVENTS.UPDATE_ACCEPTED);
    if (typeof window !== 'undefined') {
      // The controller change fires after SKIP_WAITING; a hard reload
      // is the workspace-standard pattern (matches vite-plugin-pwa).
      window.location.reload();
    }
  }

  /** Dismiss the update banner for the session. */
  public dismissUpdate(): void {
    this.updateUpdate({ ...this.update, isVisible: false });
    this.analytics?.emit(PWA_EVENTS.UPDATE_DISMISSED);
  }

  /**
   * Bind a service-worker registration for update monitoring.
   *
   * Consumers who register the SW themselves (e.g. through
   * `vite-plugin-pwa`'s `useRegisterSW`) pass the resulting
   * registration here.
   */
  public bindServiceWorker(registration: ServiceWorkerRegistration): void {
    this.registration = registration;

    // If a worker is already waiting when we bind, surface the
    // update right away.
    if (registration.waiting) {
      this.updateUpdate({ isAvailable: true, isVisible: true });
      this.analytics?.emit(PWA_EVENTS.UPDATE_AVAILABLE);
    }

    // Listen for future `updatefound` events — the browser fires
    // this before the new worker moves to `installed`.
    const onUpdateFound = (): void => {
      const nw = registration.installing;
      if (!nw) return;
      const onState = (): void => {
        // A new worker reaching `installed` while the current one is
        // active means an update is ready. The `!controller` case
        // (first-ever install) is deliberately excluded.
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateUpdate({ isAvailable: true, isVisible: true });
          this.analytics?.emit(PWA_EVENTS.UPDATE_AVAILABLE);
        }
      };
      nw.addEventListener('statechange', onState);
      this.cleanups.push(() => nw.removeEventListener('statechange', onState));
    };
    registration.addEventListener('updatefound', onUpdateFound);
    this.cleanups.push(() => registration.removeEventListener('updatefound', onUpdateFound));

    // Kick off periodic polling — Chromium's own polling isn't
    // aggressive enough for many apps.
    const interval = this.config.update?.pollingIntervalMs ?? 60_000;
    if (interval > 0) {
      this.updateInterval = setInterval(() => {
        registration.update().catch(() => {
          // fail-soft — the browser routinely rejects update() with
          // "no fetch handler" during dev; noise, not a real error.
        });
      }, interval);
    }
  }

  /**
   * Request persistent storage.
   *
   * @returns `true` when granted (or already granted).
   */
  public async requestPersistentStorage(): Promise<boolean> {
    const granted = await requestPersistentStorage();
    this.analytics?.emit(
      granted ? PWA_EVENTS.PERSISTENT_STORAGE_GRANTED : PWA_EVENTS.PERSISTENT_STORAGE_DENIED
    );
    return granted;
  }

  /**
   * Notify the service that the network went offline. Feature packages
   * that listen to `@stackra/network` can call this to fan-out
   * `pwa.offline.entered` through the analytics bridge.
   */
  public reportOffline(): void {
    this.analytics?.emit(PWA_EVENTS.OFFLINE_ENTERED);
  }

  /** Clean up subscriptions + intervals. Called by tests. */
  public destroy(): void {
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch {
        // fail-soft — a broken cleanup shouldn't prevent the others.
      }
    }
    this.cleanups.length = 0;
    if (this.updateInterval != null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // ── Subscription ──────────────────────────────────────────────────────

  /** Subscribe to snapshot changes; returns an unsubscribe function. */
  public subscribe(listener: PwaListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ───────────────────────────────────────────────────────────

  /** Bind the `beforeinstallprompt` + `appinstalled` listeners. */
  private bindInstallPrompt(): void {
    if (typeof window === 'undefined') return;

    // Respect the caller's `maxDismissals` — if they've already
    // dismissed too many times, we still capture the deferred prompt
    // (so `promptInstall()` works from a settings screen), but the
    // in-app banner stays hidden.
    const maxDismissals = this.config.install?.maxDismissals ?? 3;
    const delayMs = this.config.install?.delayMs ?? 30_000;

    const onBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault();
      // Structural cast — `BeforeInstallPromptEvent` isn't in the
      // standard lib.dom yet.
      this.deferredPrompt = e as IBeforeInstallPromptEvent;
      this.updateInstall({
        isSupported: true,
        isVisible: false,
        isInstalled: this.install.isInstalled,
        isIosSafari: this.install.isIosSafari,
        dismissCount: this.install.dismissCount,
      });
      this.analytics?.emit(PWA_EVENTS.INSTALL_PROMPT_SHOWN);

      // Delay before surfacing the banner — matches the daftplug UX.
      // The setTimeout is intentionally not `await sleep(...)` because
      // we don't want to block the outer event handler.
      if (this.install.dismissCount < maxDismissals) {
        const handle = setTimeout(() => {
          this.updateInstall({
            isSupported: true,
            isVisible: true,
            isInstalled: this.install.isInstalled,
            isIosSafari: this.install.isIosSafari,
            dismissCount: this.install.dismissCount,
          });
        }, delayMs);
        this.cleanups.push(() => clearTimeout(handle));
      }
    };

    const onAppInstalled = (): void => {
      this.updateInstall({
        isSupported: this.install.isSupported,
        isVisible: false,
        isInstalled: true,
        isIosSafari: this.install.isIosSafari,
        dismissCount: this.install.dismissCount,
      });
      this.analytics?.emit(PWA_EVENTS.INSTALL_ACCEPTED);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    this.cleanups.push(() =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    );
    this.cleanups.push(() => window.removeEventListener('appinstalled', onAppInstalled));
  }

  /** Watch `display-mode: standalone` for post-install changes. */
  private bindDisplayModeWatcher(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (): void => {
      const nextStandalone = detectStandalone();
      const nextMode = detectDisplayMode();
      // Only emit when the value actually changed — matchMedia fires
      // on every media evaluation, not just transitions.
      if (nextStandalone !== this.standalone || nextMode !== this.displayMode) {
        this.standalone = nextStandalone;
        this.displayMode = nextMode;
        this.attribution = this.buildAttribution();
        this.emit();
      }
    };

    // Both event forms — Chrome uses `addEventListener`, older Safari
    // pre-14 used `addListener`. `addEventListener` first because it's
    // the modern surface.
    mq.addEventListener('change', onChange);
    this.cleanups.push(() => mq.removeEventListener('change', onChange));
  }

  /** Read the dismiss count from `localStorage`. Fail-soft on SSR. */
  private readDismissCount(): number {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    try {
      const key = this.config.install?.dismissKey ?? 'stackra:pwa:install-dismissed';
      const value = window.localStorage.getItem(key);
      const parsed = value ? Number(value) : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      // fail-soft — localStorage is unavailable in private mode /
      // strict origin isolation contexts.
      return 0;
    }
  }

  /** Persist the dismiss count to `localStorage`. Fail-soft on SSR. */
  private persistDismissCount(next: number): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const key = this.config.install?.dismissKey ?? 'stackra:pwa:install-dismissed';
      window.localStorage.setItem(key, String(next));
    } catch {
      // fail-soft — private mode.
    }
  }

  /** Compose the attribution snapshot from parsed UTM + display mode. */
  private buildAttribution(): IPwaAttribution {
    const utm = parseUtmParams();
    const referrer = typeof document !== 'undefined' && document.referrer ? document.referrer : '';
    const isInstalledContext = this.displayMode === 'standalone' || this.displayMode === 'twa';
    return { utm, displayMode: this.displayMode, referrer, isInstalledContext };
  }

  /** Rebuild + cache the snapshot object. Called before every fan-out. */
  private buildSnapshot(): IPwaSnapshot {
    return {
      install: this.install,
      update: this.update,
      standalone: this.standalone,
      displayMode: this.displayMode,
      attribution: this.attribution,
    };
  }

  /** Update install substate + emit. */
  private updateInstall(next: IPwaInstallState): void {
    this.install = next;
    this.emit();
  }

  /** Update update substate + emit. */
  private updateUpdate(next: IPwaUpdateState): void {
    this.update = next;
    this.emit();
  }

  /**
   * Swap the cached snapshot and fan out to every subscriber.
   * Wrapped in `tap()` from `@stackra/support` for the workspace-standard
   * "act on a value + return it" flow.
   */
  private emit(): void {
    this.snapshot = tap(this.buildSnapshot(), () => {
      // The tap side-effect is the fan-out itself — a broken listener
      // must not affect the others.
      for (const listener of this.listeners) {
        try {
          listener();
        } catch {
          // fail-soft.
        }
      }
    });
  }
}
