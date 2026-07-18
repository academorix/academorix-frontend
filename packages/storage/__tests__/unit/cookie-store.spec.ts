/**
 * @file cookie-store.spec.ts
 * @module @stackra/storage/test/unit
 * @description Behavioural coverage for `CookieStore` — every method
 *   on the `IStorage` contract plus prefix / TTL / `SameSite` /
 *   `Secure` handling.
 *
 *   The suite runs under vitest's `node` environment (no jsdom
 *   dependency); a small in-memory mock stands in for
 *   `document.cookie` so we can verify both the getter (the
 *   serialised `k=v; k2=v2` string) and the setter (per-assignment
 *   `Set-Cookie`-style parsing including `Max-Age=0` deletion).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CookieStore } from '@/react/stores/cookie.store';

// ══════════════════════════════════════════════════════════════════════════════
// Mock — stateful document.cookie shim
// ══════════════════════════════════════════════════════════════════════════════

/** Values captured from the last N `Set-Cookie`-style writes. */
interface CookieWrite {
  name: string;
  value: string;
  attrs: Record<string, string | true>;
}

/** Snapshot of every attribute assignment for a given cookie name. */
const writes: CookieWrite[] = [];

/** Internal cookie jar keyed by name. `null` means "deleted / expired". */
const jar = new Map<string, string>();

function serialise(): string {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function parseWrite(raw: string): CookieWrite {
  const parts = raw.split(';').map((p) => p.trim());
  const [head, ...tail] = parts;
  const eq = head!.indexOf('=');
  const name = head!.slice(0, eq);
  const value = head!.slice(eq + 1);
  const attrs: Record<string, string | true> = {};
  for (const part of tail) {
    const attrEq = part.indexOf('=');
    if (attrEq < 0) {
      attrs[part.toLowerCase()] = true;
    } else {
      attrs[part.slice(0, attrEq).toLowerCase()] = part.slice(attrEq + 1);
    }
  }
  return { name, value, attrs };
}

function installCookieMock(): void {
  writes.length = 0;
  jar.clear();
  const doc = { cookie: '' };
  Object.defineProperty(doc, 'cookie', {
    get(): string {
      return serialise();
    },
    set(raw: string): void {
      const write = parseWrite(raw);
      writes.push(write);
      const maxAge = write.attrs['max-age'];
      if (typeof maxAge === 'string' && Number.parseInt(maxAge, 10) <= 0) {
        jar.delete(write.name);
      } else {
        jar.set(write.name, write.value);
      }
    },
    configurable: true,
  });
  (globalThis as unknown as { document: typeof doc }).document = doc;
}

function uninstallCookieMock(): void {
  writes.length = 0;
  jar.clear();
  delete (globalThis as { document?: unknown }).document;
}

// ══════════════════════════════════════════════════════════════════════════════
// Suite
// ══════════════════════════════════════════════════════════════════════════════

describe('CookieStore', () => {
  beforeEach(() => {
    installCookieMock();
  });

  afterEach(() => {
    uninstallCookieMock();
  });

  it('get() returns null for an unknown key', async () => {
    const store = new CookieStore();
    expect(await store.get('missing')).toBeNull();
  });

  it('set() then get() round-trips a JSON-serialisable value', async () => {
    const store = new CookieStore();
    await store.set('a', { hello: 'world', n: 42 });
    expect(await store.get<{ hello: string; n: number }>('a')).toEqual({
      hello: 'world',
      n: 42,
    });
  });

  it('set() writes JSON-encoded, URI-escaped values', async () => {
    const store = new CookieStore();
    await store.set('a', 'plain-string');
    // The encoded value is `%22plain-string%22` (JSON quoted + URI escaped).
    expect(writes.at(-1)?.name).toBe('a');
    expect(writes.at(-1)?.value).toBe(encodeURIComponent(JSON.stringify('plain-string')));
  });

  it('delete() clears the cookie via Max-Age=0', async () => {
    const store = new CookieStore();
    await store.set('a', 'v');
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
    // The delete write must include `Max-Age=0`.
    expect(writes.at(-1)?.attrs['max-age']).toBe('0');
  });

  it('has() returns true only for present cookies', async () => {
    const store = new CookieStore();
    await store.set('a', 'v');
    expect(await store.has('a')).toBe(true);
    expect(await store.has('missing')).toBe(false);
  });

  it('keys() enumerates only cookies under the configured prefix', async () => {
    // `prefix` names the namespace WITHOUT a trailing colon — the
    // shared prefixKey util inserts one, matching how every other
    // store composes over its prefix.
    const prefixed = new CookieStore({ prefix: 'app' });
    const bare = new CookieStore();

    await prefixed.set('theme', 'dark');
    await prefixed.set('lang', 'en');
    // Simulate a non-owned cookie set by another consumer.
    await bare.set('unrelated', 'v');

    expect((await prefixed.keys()).sort()).toEqual(['lang', 'theme']);
    expect((await bare.keys()).sort()).toEqual(['app:lang', 'app:theme', 'unrelated']);
  });

  it('clear() only deletes cookies under the configured prefix', async () => {
    const prefixed = new CookieStore({ prefix: 'app' });
    const bare = new CookieStore();

    await prefixed.set('theme', 'dark');
    await bare.set('unrelated', 'v');
    await prefixed.clear();

    expect(await prefixed.get('theme')).toBeNull();
    // The un-prefixed cookie must survive.
    expect(await bare.get('unrelated')).toBe('v');
  });

  it('set() applies default cookie attributes (SameSite=Lax, path=/)', async () => {
    const store = new CookieStore();
    await store.set('a', 'v');
    const write = writes.at(-1)!;
    expect(write.attrs['path']).toBe('/');
    expect(write.attrs['samesite']).toBe('Lax');
    // No Secure by default (dev servers on HTTP still work).
    expect(write.attrs['secure']).toBeUndefined();
  });

  it('set() respects `secure: true` config', async () => {
    const store = new CookieStore({ secure: true });
    await store.set('a', 'v');
    expect(writes.at(-1)?.attrs['secure']).toBe(true);
  });

  it('set() writes SameSite=Strict / None when configured', async () => {
    const strict = new CookieStore({ sameSite: 'Strict' });
    await strict.set('a', 'v');
    expect(writes.at(-1)?.attrs['samesite']).toBe('Strict');

    const none = new CookieStore({ sameSite: 'None' });
    await none.set('b', 'v');
    expect(writes.at(-1)?.attrs['samesite']).toBe('None');
  });

  it('set() with per-call `ttlSeconds` writes Max-Age', async () => {
    const store = new CookieStore();
    await store.set('a', 'v', { ttlSeconds: 3600 });
    expect(writes.at(-1)?.attrs['max-age']).toBe('3600');
  });

  it('set() falls back to the configured `maxAge` when no per-call TTL is given', async () => {
    const store = new CookieStore({ maxAge: 60 });
    await store.set('a', 'v');
    expect(writes.at(-1)?.attrs['max-age']).toBe('60');
  });

  it('set() omits Max-Age entirely when neither config nor call supplies one (session cookie)', async () => {
    const store = new CookieStore();
    await store.set('a', 'v');
    expect(writes.at(-1)?.attrs['max-age']).toBeUndefined();
  });

  it('get() returns null on corrupt JSON (fail-soft)', async () => {
    // Bypass CookieStore and write a raw un-encoded value.
    (globalThis as unknown as { document: { cookie: string } }).document.cookie =
      'a=not-json; path=/; SameSite=Lax';
    const store = new CookieStore();
    expect(await store.get('a')).toBeNull();
  });

  it('every operation is a fail-soft no-op when `document` is missing (SSR)', async () => {
    uninstallCookieMock();

    const store = new CookieStore();
    expect(await store.get('a')).toBeNull();
    // set / delete / clear must not throw.
    await expect(store.set('a', 'v')).resolves.toBeUndefined();
    await expect(store.delete('a')).resolves.toBeUndefined();
    await expect(store.clear()).resolves.toBeUndefined();
    expect(await store.has('a')).toBe(false);
    expect(await store.keys()).toEqual([]);
  });
});
