/**
 * @file utils.test.ts
 * @module @stackra/scope/__tests__/unit
 * @description Pure util tests — parseMaterializedPath + buildTree.
 */

import { describe, it, expect } from 'vitest';

import { parseMaterializedPath, buildTree } from '@/core/utils';
import type { IScopeDefinition } from '@/core/interfaces';

describe('parseMaterializedPath', () => {
  it('returns ids self → root', () => {
    expect(parseMaterializedPath('/aaa/bbb/ccc')).toEqual(['ccc', 'bbb', 'aaa']);
  });
  it('handles a single segment', () => {
    expect(parseMaterializedPath('/single')).toEqual(['single']);
  });
  it('handles empty', () => {
    expect(parseMaterializedPath('')).toEqual([]);
  });
});

describe('buildTree', () => {
  it('nests by parent_slug and sorts by sort_order', () => {
    const flat: IScopeDefinition[] = [
      { slug: 'venue', label: 'Venue', parent_slug: 'owner', sort_order: 2 },
      { slug: 'global', label: 'Global', parent_slug: null, sort_order: 0 },
      { slug: 'owner', label: 'Owner', parent_slug: 'global', sort_order: 1 },
    ];
    const tree = buildTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.slug).toBe('global');
    expect(tree[0]!.children[0]!.slug).toBe('owner');
    expect(tree[0]!.children[0]!.children[0]!.slug).toBe('venue');
  });
});
