/**
 * @file scope-devtools-panel.spec.ts
 * @module @stackra/scope/__tests__/unit
 * @description Behavioural spec for the `ScopeDevtoolsPanel` — metadata
 *   stamp, badge behaviour — and for the `ScopeInspectorSource` region
 *   collection under Node (no `document` global).
 */

import 'reflect-metadata';

import { describe, expect, it } from 'vitest';
import { DEVTOOLS_PANEL_METADATA_KEY } from '@stackra/contracts';

import { ScopeDevtoolsPanel } from '@/react/devtools/scope.devtools-panel';
import { ScopeInspectorSource } from '@/react/devtools/scope.inspector-source';

// ────────────────────────────────────────────────────────────────────────
// Specs — panel
// ────────────────────────────────────────────────────────────────────────

describe('ScopeDevtoolsPanel', () => {
  it('stamps @DevtoolsPanel metadata with id "scope", framework category, order 30', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, ScopeDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata?.id).toBe('scope');
    expect(metadata?.title).toBe('Scope');
    expect(metadata?.category).toBe('framework');
    expect(metadata?.order).toBe(30);
  });

  it('constructs with an absent service and exposes IDevtoolsPanel fields', () => {
    const panel = new ScopeDevtoolsPanel();
    expect(panel.id).toBe('scope');
    expect(panel.title).toBe('Scope');
    expect(panel.category).toBe('framework');
    expect(panel.view.type).toBe('component');
  });

  it('badge() returns null when the service is absent', () => {
    // Missing service is a valid state (feature-only devtools consumer).
    expect(new ScopeDevtoolsPanel().badge()).toBeNull();
  });

  it('badge() returns the path depth when a scope is resolved', () => {
    // Build the minimal stub that mimics ScopeService.getScope() —
    // the panel only reads `getScope()?.path.length`.
    const stubScopeService = {
      getScope: () => ({
        ownerId: 'o1',
        nodeId: 'n1',
        level: 'venue',
        entityId: 'v1',
        path: ['n1', 'root'],
        ancestors: {},
      }),
    } as never;
    expect(new ScopeDevtoolsPanel(stubScopeService).badge()).toBe(2);
  });

  it('badge() returns null when the service throws', () => {
    // fail-soft — a broken snapshot must not blow up the badge.
    const throwingService = {
      getScope: () => {
        throw new Error('boom');
      },
    } as never;
    expect(new ScopeDevtoolsPanel(throwingService).badge()).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — inspector source
// ────────────────────────────────────────────────────────────────────────

describe('ScopeInspectorSource', () => {
  it('has the expected identity metadata', () => {
    const source = new ScopeInspectorSource();
    expect(source.id).toBe('scope');
    expect(source.panelId).toBe('scope');
    expect(source.label).toBe('Scope regions');
  });

  it('returns an empty region list when document is unavailable', () => {
    // Node env — no `document` global, so `collect()` short-circuits
    // to an empty array. This is the SSR-safe path exercised by tests.
    const source = new ScopeInspectorSource();
    expect(source.collect()).toHaveLength(0);
  });
});
