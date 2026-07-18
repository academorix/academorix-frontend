/**
 * @file csp-service.test.ts
 * @module @stackra/csp/__tests__/unit
 * @description CspService — nonce placeholder replacement, header name,
 *   and merging of registry sources.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { CspService } from '@/core/services/csp.service';
import { NonceGenerator } from '@/core/services/nonce-generator.service';
import { CspRegistry } from '@/core/registries/csp.registry';
import type { CspModuleOptions } from '@/core/interfaces/csp-module-options.interface';

function makeService(config: CspModuleOptions, registry = new CspRegistry()): CspService {
  return new CspService(config, new NonceGenerator(), registry);
}

describe('CspService', () => {
  let registry: CspRegistry;

  beforeEach(() => {
    registry = new CspRegistry();
  });

  it("replaces the 'nonce' placeholder with the generated nonce", () => {
    const svc = makeService({ scriptSrc: ["'self'", "'nonce'"] }, registry);
    const policy = svc.generatePolicy();

    expect(policy.nonce.length).toBeGreaterThan(0);
    expect(policy.header).toContain(`'nonce-${policy.nonce}'`);
    expect(policy.header).not.toContain("'nonce'");
  });

  it('drops nonce placeholders when nonce generation is disabled', () => {
    const svc = makeService({ scriptSrc: ["'self'", "'nonce'"], nonce: false }, registry);
    const policy = svc.generatePolicy();

    expect(policy.nonce).toBe('');
    expect(policy.header).not.toContain("'nonce'");
    expect(policy.header).toContain("script-src 'self'");
  });

  it('sets the report-only header name when configured', () => {
    expect(makeService({ reportOnly: true }, registry).generatePolicy().headerName).toBe(
      'Content-Security-Policy-Report-Only'
    );
    expect(makeService({}, registry).generatePolicy().headerName).toBe('Content-Security-Policy');
  });

  it('merges registry sources into the generated directives', () => {
    registry.registerPolicy({
      name: 'stripe',
      scriptSrc: ['https://js.stripe.com'],
      frameSrc: ['https://hooks.stripe.com'],
    });
    const svc = makeService({ scriptSrc: ["'self'"] }, registry);
    const policy = svc.generatePolicy();

    expect(policy.header).toContain('script-src');
    expect(policy.header).toContain('https://js.stripe.com');
    // frame-src merges the config default ('none') with the feature source.
    expect(policy.header).toContain('https://hooks.stripe.com');
  });

  it('caches the policy via getPolicy and regenerates after reset', () => {
    const svc = makeService({ scriptSrc: ["'self'", "'nonce'"] }, registry);
    const first = svc.getPolicy();
    expect(svc.getPolicy()).toBe(first);

    svc.resetPolicy();
    expect(svc.getPolicy().nonce).not.toBe(first.nonce);
  });
});
