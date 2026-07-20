/**
 * @file draft.service.ts
 * @module @stackra/ai/core/services
 * @description Tracks pending draft-then-confirm writes and confirms them
 *   via the `AiClientService`. Never applies writes on the client itself
 *   (Req 16.3) — the backend is the source of truth for the underlying
 *   entity change.
 *
 *   Requirement traceability:
 *
 *   - 16.1 — surface drafts in a pending state.
 *   - 16.2 — confirm via `client.confirmDraft(id)`.
 *   - 16.3 — never apply writes on the client while pending.
 *   - 16.4 — keep drafts pending + surface a descriptive error on failure.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  AI_CLIENT,
  AI_EVENTS,
  AiDraftStatus,
  EVENT_EMITTER,
  type IAiClient,
  type IAiDraft,
  type IEventEmitter,
} from "@stackra/contracts";

import { AiDraftError } from "../errors";

/**
 * DraftService — Requirement 16.
 */
@Injectable()
export class DraftService {
  private readonly logger = new Logger(DraftService.name);

  /** Drafts keyed by id. */
  private readonly items = new Map<string, IAiDraft>();

  /** Listener subscribers. */
  private readonly listeners = new Set<() => void>();

  public constructor(
    @Inject(AI_CLIENT) private readonly client: IAiClient,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Ingest a draft the backend has surfaced. Stored in a pending state.
   *
   * @param draft - Draft metadata + payload.
   */
  public ingest(draft: IAiDraft): void {
    this.items.set(draft.id, { ...draft, status: AiDraftStatus.Pending });
    this.notify();
    void this.events?.emit(AI_EVENTS.DRAFT_PENDING, { draft });
  }

  /**
   * Confirm a pending draft against the backend.
   *
   * On success, the draft's status transitions to `Confirmed` and is
   * removed from the pending list. On failure, the draft stays pending
   * (Req 16.4) and an {@link AiDraftError} is thrown.
   *
   * @param draftId - Identifier of the draft to confirm.
   * @throws {@link AiDraftError} when the backend rejects the confirm.
   */
  public async confirm(draftId: string): Promise<void> {
    const draft = this.items.get(draftId);
    if (!draft) {
      throw new AiDraftError(`[DraftService] unknown draft "${draftId}"`, draftId);
    }
    try {
      await this.client.confirmDraft(draftId);
    } catch (err) {
      this.logger.warn(`[DraftService] confirmation failed for draft "${draftId}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AiDraftError(`[DraftService] failed to confirm draft "${draftId}"`, draftId, err);
    }
    // Success — mark confirmed + drop.
    this.items.set(draftId, { ...draft, status: AiDraftStatus.Confirmed });
    this.notify();
    void this.events?.emit(AI_EVENTS.DRAFT_CONFIRMED, { draftId });
    this.items.delete(draftId);
    this.notify();
  }

  /** Snapshot of every currently-known draft (pending + last-confirmed). */
  public all(): IAiDraft[] {
    return Array.from(this.items.values());
  }

  /** Look up a draft by id. */
  public get(draftId: string): IAiDraft | undefined {
    return this.items.get(draftId);
  }

  /** Whether a draft with the given id is currently tracked. */
  public has(draftId: string): boolean {
    return this.items.has(draftId);
  }

  /** Drafts filtered to those still in the pending state. */
  public pending(): IAiDraft[] {
    return this.all().filter((d) => d.status === AiDraftStatus.Pending);
  }

  /** Subscribe to draft-list changes. */
  public onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        this.logger.warn("[DraftService] change listener threw", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}
