/**
 * @file consent-registry.test.ts
 * @module @stackra/consent/__tests__/unit
 * @description ConsentRegistry — population from config + lookup/filtering.
 */

import { describe, it, expect } from 'vitest';

import { ConsentRegistry } from '@/core/services/consent-registry.service';
import type { IConsentCategory, IConsentModuleOptions } from '@/core/types';

const categories: IConsentCategory[] = [
  {
    slug: 'necessary',
    label: 'Necessary',
    description: 'Essential',
    required: true,
    default: true,
  },
  { slug: 'analytics', label: 'Analytics', description: 'Usage', required: false, default: false },
  {
    slug: 'functional',
    label: 'Functional',
    description: 'Enhanced',
    required: false,
    default: true,
  },
];

function makeRegistry(): ConsentRegistry {
  const config = { categories } as IConsentModuleOptions;
  const registry = new ConsentRegistry(config);
  registry.onModuleInit();
  return registry;
}

describe('ConsentRegistry', () => {
  it('populates categories from config on init', () => {
    const registry = makeRegistry();
    expect(registry.getCategories()).toHaveLength(3);
  });

  it('looks up a category by slug', () => {
    const registry = makeRegistry();
    expect(registry.getCategory('analytics')?.slug).toBe('analytics');
    expect(registry.getCategory('missing')).toBeUndefined();
  });

  it('filters required vs non-required categories', () => {
    const registry = makeRegistry();
    expect(registry.getRequired().map((c) => c.slug)).toEqual(['necessary']);
    expect(registry.getNonRequired().map((c) => c.slug)).toEqual(['analytics', 'functional']);
  });

  it('populate replaces existing categories', () => {
    const registry = makeRegistry();
    registry.populate([
      {
        slug: 'marketing',
        label: 'Marketing',
        description: 'Ads',
        required: false,
        default: false,
      },
    ]);
    expect(registry.getCategories()).toHaveLength(1);
    expect(registry.getCategory('marketing')).toBeDefined();
  });
});
