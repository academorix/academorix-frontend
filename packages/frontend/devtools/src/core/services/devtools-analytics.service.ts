/**
 * @file devtools-analytics.service.ts
 * @module @stackra/devtools/core/services
 * @description Fan-out of devtools lifecycle events to the
 *   `EVENT_EMITTER` bus.
 *
 *   Consumers who want to record devtools usage (session length,
 *   most-visited panel, most-triggered action) subscribe to the
 *   `DEVTOOLS_EVENTS.*` names on the shared emitter. This service
 *   is the single place devtools UI code emits from — every
 *   caller routes through one of the typed helpers below so the
 *   event names stay in sync with the contract.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { DEVTOOLS_EVENTS, EVENT_EMITTER, type IEventEmitter } from '@stackra/contracts';

import { DEVTOOLS_CONFIG } from '../constants';
import type { IDevtoolsModuleOptions } from '../interfaces/devtools-module-options.interface';

/**
 * Fire-and-forget wrapper around the shared `IEventEmitter`.
 *
 * Every method is a no-op when either the emitter isn't bound or
 * the caller has disabled analytics via `config.analytics = false`.
 */
@Injectable()
export class DevtoolsAnalyticsService {
  public constructor(
    @Inject(DEVTOOLS_CONFIG) private readonly config: IDevtoolsModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly emitter?: IEventEmitter
  ) {}

  /** Emit `SHELL_OPENED`. */
  public shellOpened(): void {
    this.emit(DEVTOOLS_EVENTS.SHELL_OPENED, {});
  }

  /** Emit `SHELL_CLOSED`. */
  public shellClosed(): void {
    this.emit(DEVTOOLS_EVENTS.SHELL_CLOSED, {});
  }

  /** Emit `PANEL_ACTIVATED`. */
  public panelActivated(panelId: string): void {
    this.emit(DEVTOOLS_EVENTS.PANEL_ACTIVATED, { panelId });
  }

  /** Emit `INSPECTOR_ENABLED`. */
  public inspectorEnabled(): void {
    this.emit(DEVTOOLS_EVENTS.INSPECTOR_ENABLED, {});
  }

  /** Emit `INSPECTOR_DISABLED`. */
  public inspectorDisabled(): void {
    this.emit(DEVTOOLS_EVENTS.INSPECTOR_DISABLED, {});
  }

  /** Emit `INSPECTOR_REGION_CLICKED`. */
  public inspectorRegionClicked(regionId: string, panelId: string): void {
    this.emit(DEVTOOLS_EVENTS.INSPECTOR_REGION_CLICKED, { regionId, panelId });
  }

  /** Emit `ACTION_TRIGGERED`. */
  public actionTriggered(panelId: string, actionId: string): void {
    this.emit(DEVTOOLS_EVENTS.ACTION_TRIGGERED, { panelId, actionId });
  }

  private emit(name: string, payload: Record<string, unknown>): void {
    // Disable fan-out when either analytics is off or the emitter
    // isn't wired — neither path should fail the caller.
    if (this.config.analytics === false) return;
    if (!this.emitter) return;
    try {
      const p = this.emitter.emit(name, payload);
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch(() => {
          // fail-soft — see the panels registry's `emit` docblock.
        });
      }
    } catch {
      // fail-soft — a broken emitter cannot stall the UI.
    }
  }
}
