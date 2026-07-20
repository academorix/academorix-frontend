/**
 * @file mock-csp-service.ts
 * @module @stackra/csp/testing
 * @description In-memory `ICspService` implementation for tests.
 *
 *   Emits deterministic nonces (`'test-nonce-1'`, `'test-nonce-2'`, …)
 *   from `generatePolicy()` and caches the first result for
 *   `getPolicy()`. Records every call on `.calls` so tests can assert on
 *   which side of the SSR-vs-SPA contract was exercised.
 */

import type { ICspPolicyResult, ICspService } from '@stackra/contracts';

/** A recorded `ICspService` call. */
export type RecordedCspCall = 'generatePolicy' | 'getPolicy' | 'resetPolicy';

/** Options for {@link MockCspService}. */
export interface MockCspServiceOptions {
  /** Header value returned. Defaults to `"script-src 'self' 'nonce-<n>'"`. */
  header?: string;
  /** Header name — `Content-Security-Policy` (default) or `-Report-Only`. */
  headerName?: string;
  /** Custom nonce sequence. Defaults to `test-nonce-1`, `test-nonce-2`, …. */
  nonces?: readonly string[];
}

/**
 * In-memory CSP service for testing.
 *
 * Mirrors the full `ICspService` contract (`generatePolicy` /
 * `getPolicy` / `resetPolicy`) so it can be registered under
 * `CSP_SERVICE` in tests as a drop-in replacement for the real
 * `CspService`.
 */
export class MockCspService implements ICspService {
  /** Recorded call log. */
  public readonly calls: RecordedCspCall[] = [];

  private cached: ICspPolicyResult | null = null;
  private counter = 0;
  private readonly nonceSequence: readonly string[];
  private readonly headerName: string;
  private readonly headerTemplate: string | undefined;

  public constructor(options: MockCspServiceOptions = {}) {
    this.nonceSequence = options.nonces ?? [];
    this.headerName = options.headerName ?? 'Content-Security-Policy';
    this.headerTemplate = options.header;
  }

  public generatePolicy(): ICspPolicyResult {
    this.calls.push('generatePolicy');
    const nonce = this.nextNonce();
    return {
      nonce,
      header: this.headerTemplate ?? `script-src 'self' 'nonce-${nonce}'`,
      headerName: this.headerName,
    };
  }

  public getPolicy(): ICspPolicyResult {
    this.calls.push('getPolicy');
    if (!this.cached) {
      // Bump the counter for the internal generation, then record via
      // this method (not `generatePolicy`) so the call log reflects the
      // caller's intent.
      const nonce = this.nextNonce();
      this.cached = {
        nonce,
        header: this.headerTemplate ?? `script-src 'self' 'nonce-${nonce}'`,
        headerName: this.headerName,
      };
    }
    return this.cached;
  }

  public resetPolicy(): void {
    this.calls.push('resetPolicy');
    this.cached = null;
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Peek at the cached policy without recording a call. */
  public peek(): ICspPolicyResult | null {
    return this.cached;
  }

  /** Reset both the call log and the cached policy. */
  public reset(): void {
    this.calls.length = 0;
    this.cached = null;
    this.counter = 0;
  }

  private nextNonce(): string {
    if (this.counter < this.nonceSequence.length) {
      const value = this.nonceSequence[this.counter]!;
      this.counter += 1;
      return value;
    }
    this.counter += 1;
    return `test-nonce-${this.counter}`;
  }
}
