/**
 * @file dialog-service.interface.ts
 * @module @stackra/contracts/interfaces/ui
 * @description Imperative dialog surface for `@stackra/ui`.
 */

/**
 * A dialog registration — components register themselves via a
 * `useDialog(id)` hook so the imperative service can `open`/`close`
 * them by id.
 */
export interface IDialogRegistration {
  readonly dialogId: string;
  open(payload?: unknown): void;
  close(): void;
}

/**
 * Imperative dialog service.
 *
 * Bound under `DIALOG_SERVICE`. Consumed by the `DialogHandler` from
 * `@stackra/ui/actions`.
 */
export interface IDialogService {
  register(reg: IDialogRegistration): () => void;
  open(dialogId: string, payload?: unknown): void;
  close(dialogId: string): void;
  has(dialogId: string): boolean;
}
