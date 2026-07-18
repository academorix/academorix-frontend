/**
 * @file mock-dialog-service.ts
 * @module @stackra/ui/testing
 * @description In-memory `IDialogService` implementation for tests.
 *
 *   Records every registration, open, and close on `.calls` for
 *   assertions. Dialogs registered via `register()` receive their
 *   `open()` / `close()` invocations when the corresponding service
 *   method fires — same last-wins duplicate semantics as the real
 *   `DialogService` (minus the warning).
 */

import type { IDialogRegistration, IDialogService } from "@stackra/contracts";

/** A recorded dialog-service call. */
export type RecordedDialogCall =
  | { kind: "register"; dialogId: string }
  | { kind: "unregister"; dialogId: string }
  | { kind: "open"; dialogId: string; payload?: unknown }
  | { kind: "close"; dialogId: string };

/**
 * In-memory dialog service for testing.
 *
 * @example
 * ```ts
 * const dialogs = new MockDialogService();
 * const spy = { dialogId: 'confirm', open: vi.fn(), close: vi.fn() };
 * dialogs.register(spy);
 * dialogs.open('confirm', { reason: 'delete' });
 * expect(spy.open).toHaveBeenCalledWith({ reason: 'delete' });
 * ```
 */
export class MockDialogService implements IDialogService {
  /** Recorded call log. */
  public readonly calls: RecordedDialogCall[] = [];

  private readonly registrations = new Map<string, IDialogRegistration>();

  public register(reg: IDialogRegistration): () => void {
    this.calls.push({ kind: "register", dialogId: reg.dialogId });
    this.registrations.set(reg.dialogId, reg);
    return () => {
      this.calls.push({ kind: "unregister", dialogId: reg.dialogId });
      this.registrations.delete(reg.dialogId);
    };
  }

  public open(dialogId: string, payload?: unknown): void {
    this.calls.push({ kind: "open", dialogId, payload });
    this.registrations.get(dialogId)?.open(payload);
  }

  public close(dialogId: string): void {
    this.calls.push({ kind: "close", dialogId });
    this.registrations.get(dialogId)?.close();
  }

  public has(dialogId: string): boolean {
    return this.registrations.has(dialogId);
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Currently-registered dialog ids. */
  public getRegisteredIds(): string[] {
    return Array.from(this.registrations.keys());
  }

  /** Reset call log; keeps registrations. */
  public resetCalls(): void {
    this.calls.length = 0;
  }
}
