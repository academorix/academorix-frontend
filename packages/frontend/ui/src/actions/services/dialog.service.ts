/**
 * @file dialog.service.ts
 * @module @stackra/ui/actions/services
 * @description DialogService — imperative dialog surface backed by a
 *   map of `{ dialogId → registration }`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { IDialogRegistration, IDialogService, ILoggerManager } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

/**
 * DialogService — imperative dialog open/close by id.
 */
@Injectable()
export class DialogService implements IDialogService {
  private readonly registrations = new Map<string, IDialogRegistration>();

  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  public register(reg: IDialogRegistration): () => void {
    if (this.registrations.has(reg.dialogId)) {
      this.logger
        ?.channel("ui", "dialog")
        .warn(`[dialog] Duplicate registration for id "${reg.dialogId}" — last-wins.`);
    }
    this.registrations.set(reg.dialogId, reg);
    return () => this.registrations.delete(reg.dialogId);
  }

  public open(dialogId: string, payload?: unknown): void {
    const reg = this.registrations.get(dialogId);
    if (!reg) {
      this.logger
        ?.channel("ui", "dialog")
        .warn(`[dialog] No dialog registered under "${dialogId}".`);
      return;
    }
    reg.open(payload);
  }

  public close(dialogId: string): void {
    this.registrations.get(dialogId)?.close();
  }

  public has(dialogId: string): boolean {
    return this.registrations.has(dialogId);
  }
}
