/**
 * @file draft.service.test.ts
 * @description Unit tests for {@link DraftService} — pending list,
 *   client confirm on success (Req 16.2), keep-pending + typed error on
 *   failure (Req 16.4), no client-side write application (Req 16.3).
 */

import { describe, expect, it, vi } from 'vitest';
import { AiDraftStatus, type IAiClient, type IAiDraft } from '@stackra/contracts';

import { DraftService } from '@/core/services/draft.service';
import { AiDraftError } from '@/core/errors';

function makeClient(overrides: { confirm?: (id: string) => Promise<void> } = {}): IAiClient {
  return {
    confirmDraft: vi.fn(overrides.confirm ?? (() => Promise.resolve())),
  } as unknown as IAiClient;
}

const draft = (id: string): IAiDraft => ({
  id,
  actionKey: 'orders.order.refund',
  summary: 'Refund order 42',
  payload: { orderId: 42 },
  status: AiDraftStatus.Pending,
});

describe('DraftService', () => {
  it('ingest stores a draft in the pending state', () => {
    const service = new DraftService(makeClient());
    service.ingest(draft('d1'));
    expect(service.has('d1')).toBe(true);
    expect(service.get('d1')?.status).toBe(AiDraftStatus.Pending);
  });

  it('pending() filters to Pending drafts', () => {
    const service = new DraftService(makeClient());
    service.ingest(draft('d1'));
    service.ingest(draft('d2'));
    expect(
      service
        .pending()
        .map((d) => d.id)
        .sort()
    ).toEqual(['d1', 'd2']);
  });

  it('confirm() calls client.confirmDraft and clears the draft on success', async () => {
    const client = makeClient();
    const service = new DraftService(client);
    service.ingest(draft('d1'));
    await service.confirm('d1');
    expect(client.confirmDraft).toHaveBeenCalledWith('d1');
    expect(service.has('d1')).toBe(false);
  });

  it('confirm() keeps the draft pending and throws AiDraftError on failure (Req 16.4)', async () => {
    const client = makeClient({
      confirm: () => Promise.reject(new Error('backend down')),
    });
    const service = new DraftService(client);
    service.ingest(draft('d1'));

    await expect(service.confirm('d1')).rejects.toBeInstanceOf(AiDraftError);
    // Draft still tracked, still pending.
    expect(service.has('d1')).toBe(true);
    expect(service.get('d1')?.status).toBe(AiDraftStatus.Pending);
  });

  it('confirm() throws AiDraftError for an unknown draft id', async () => {
    const service = new DraftService(makeClient());
    await expect(service.confirm('missing')).rejects.toBeInstanceOf(AiDraftError);
  });

  it('notifies onChange listeners on ingest and confirm', async () => {
    const service = new DraftService(makeClient());
    const listener = vi.fn();
    service.onChange(listener);

    service.ingest(draft('d1'));
    await service.confirm('d1');

    // ingest (1) + confirmed transition (2) + delete (3)
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('never applies the draft payload on the client (Req 16.3)', async () => {
    // The service exposes no `apply()` method — payload is confirm-only.
    const service = new DraftService(makeClient());
    const s = service as unknown as { apply?: unknown };
    expect(s.apply).toBeUndefined();
  });
});
