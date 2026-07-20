/**
 * @file runtime-caching.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Tests for {@link getRuntimeCaching}. Covers default
 *   rule set, API opt-out, regex-escaped prefix, HTML navigation
 *   toggle, and cache-name prefix customisation.
 */

import { describe, expect, it } from 'vitest';

import { getRuntimeCaching } from '@/workbox';
import type { IRuntimeCachingRule } from '@/workbox';

/** Invoke a rule's URL matcher for a given path. */
function matches(rule: IRuntimeCachingRule, pathname: string, sameOrigin = true): boolean {
  const url = new URL(`https://example.com${pathname}`);
  if (typeof rule.urlPattern === 'function') return rule.urlPattern({ url, sameOrigin });
  return rule.urlPattern.test(pathname);
}

describe('getRuntimeCaching — defaults', () => {
  it('emits four rules (API, images, fonts, html) with the stackra prefix', () => {
    const rules = getRuntimeCaching();
    expect(rules).toHaveLength(4);
    expect(rules[0]?.options?.cacheName).toBe('stackra-pwa-api');
    expect(rules[1]?.options?.cacheName).toBe('stackra-pwa-images');
    expect(rules[2]?.options?.cacheName).toBe('stackra-pwa-fonts');
    expect(rules[3]?.options?.cacheName).toBe('stackra-pwa-html');
  });

  it('uses NetworkFirst for API and HTML, CacheFirst for images and fonts', () => {
    const [api, images, fonts, html] = getRuntimeCaching();
    expect(api?.handler).toBe('NetworkFirst');
    expect(html?.handler).toBe('NetworkFirst');
    expect(images?.handler).toBe('CacheFirst');
    expect(fonts?.handler).toBe('CacheFirst');
  });

  it('applies the API 5s network timeout', () => {
    const [api] = getRuntimeCaching();
    expect(api?.options?.networkTimeoutSeconds).toBe(5);
  });

  it('caches only status 0 and 200 responses across every rule', () => {
    const rules = getRuntimeCaching();
    for (const rule of rules) {
      expect(rule.options?.cacheableResponse?.statuses).toEqual([0, 200]);
    }
  });

  it('matches same-origin /api/* requests through the API rule', () => {
    const [api] = getRuntimeCaching();
    expect(api).toBeDefined();
    if (!api) return;
    expect(matches(api, '/api/users')).toBe(true);
    expect(matches(api, '/api')).toBe(true);
    expect(matches(api, '/apix/users')).toBe(false);
  });

  it('only matches API when same-origin', () => {
    const [api] = getRuntimeCaching();
    expect(api).toBeDefined();
    if (!api) return;
    expect(matches(api, '/api/users', false)).toBe(false);
  });

  it('matches common image extensions', () => {
    const [, images] = getRuntimeCaching();
    if (!images) return;
    for (const path of [
      '/logo.png',
      '/hero.JPG',
      '/photo.jpeg',
      '/icon.svg',
      '/anim.gif',
      '/next.webp',
      '/next.avif',
      '/favicon.ico',
    ]) {
      expect(matches(images, path)).toBe(true);
    }
  });

  it('matches common font extensions', () => {
    const [, , fonts] = getRuntimeCaching();
    if (!fonts) return;
    for (const path of [
      '/inter.woff',
      '/inter.woff2',
      '/legacy.ttf',
      '/legacy.otf',
      '/legacy.eot',
    ]) {
      expect(matches(fonts, path)).toBe(true);
    }
  });

  it('routes extensionless same-origin paths to the HTML rule', () => {
    const rules = getRuntimeCaching();
    const html = rules[3];
    if (!html) return;
    expect(matches(html, '/dashboard')).toBe(true);
    expect(matches(html, '/x/y/z')).toBe(true);
    expect(matches(html, '/asset.js')).toBe(false);
  });
});

describe('getRuntimeCaching — options', () => {
  it('drops the API rule when includeApi is false', () => {
    const rules = getRuntimeCaching({ includeApi: false });
    expect(rules).toHaveLength(3);
    expect(rules[0]?.options?.cacheName).toBe('stackra-pwa-images');
  });

  it('drops the HTML navigation rule when includeHtmlNavigation is false', () => {
    const rules = getRuntimeCaching({ includeHtmlNavigation: false });
    expect(rules).toHaveLength(3);
    expect(rules[rules.length - 1]?.options?.cacheName).toBe('stackra-pwa-fonts');
  });

  it('escapes regex metacharacters in a custom apiPathPrefix', () => {
    // `/api.v1` must only match `/api.v1/*`, never `/apiXv1/*`.
    const [api] = getRuntimeCaching({ apiPathPrefix: '/api.v1' });
    if (!api) return;
    expect(matches(api, '/api.v1/users')).toBe(true);
    expect(matches(api, '/apiXv1/users')).toBe(false);
  });

  it('honours a custom cacheNamePrefix', () => {
    const rules = getRuntimeCaching({ cacheNamePrefix: 'myapp' });
    expect(rules[0]?.options?.cacheName).toBe('myapp-api');
    expect(rules[1]?.options?.cacheName).toBe('myapp-images');
  });

  it('propagates apiMaxAgeSeconds + apiMaxEntries into the expiration', () => {
    const [api] = getRuntimeCaching({ apiMaxAgeSeconds: 3600, apiMaxEntries: 50 });
    expect(api?.options?.expiration).toEqual({ maxAgeSeconds: 3600, maxEntries: 50 });
  });
});
