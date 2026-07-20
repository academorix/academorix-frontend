/**
 * @file context.registry.test.ts
 * @description Unit tests for {@link ContextRegistry} — register/update/
 *   unregister lifecycle, focus-stack ordering (Req 11.2, 11.3), scope
 *   keying, and change notification.
 */

import { describe, expect, it, vi } from 'vitest';

import { ContextRegistry } from '@/core/registries/context.registry';

describe('ContextRegistry', () => {
  it('registers a frame with the requested priority + a fresh seq', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'page', snapshot: { path: '/orders' }, priority: 1 });
    const frame = registry.get('page');
    expect(frame).toMatchObject({ key: 'page', priority: 1 });
    expect(frame?.seq).toBe(0);
  });

  it('assigns monotonically increasing seq values on register', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'a', snapshot: null });
    registry.register({ key: 'b', snapshot: null });
    registry.register({ key: 'c', snapshot: null });
    expect(registry.get('a')?.seq).toBe(0);
    expect(registry.get('b')?.seq).toBe(1);
    expect(registry.get('c')?.seq).toBe(2);
  });

  it('update mutates snapshot but preserves seq', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'page', snapshot: { path: '/a' }, priority: 0 });
    const before = registry.get('page')!;
    registry.update('page', { path: '/b' });
    const after = registry.get('page')!;
    expect(after.snapshot).toEqual({ path: '/b' });
    expect(after.seq).toBe(before.seq);
  });

  it('unregister removes the frame', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'k', snapshot: null });
    registry.unregister('k');
    expect(registry.has('k')).toBe(false);
    expect(registry.count()).toBe(0);
  });

  it('supports scope-distinct registrations', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'view', snapshot: 'A', scope: 'drawer' });
    registry.register({ key: 'view', snapshot: 'B', scope: 'popup' });
    expect(registry.count()).toBe(2);
    expect(registry.get('view', 'drawer')?.snapshot).toBe('A');
    expect(registry.get('view', 'popup')?.snapshot).toBe('B');
  });

  it('orderedStack orders by (priority desc, seq desc) — later at same priority is topmost', () => {
    const registry = new ContextRegistry();
    // Register a page, then a drawer over it, then a popup over both.
    registry.register({ key: 'page', snapshot: null, priority: 0 });
    registry.register({ key: 'drawer', snapshot: null, priority: 1 });
    registry.register({ key: 'popup', snapshot: null, priority: 2 });

    const stack = registry.orderedStack();
    expect(stack.map((f) => f.key)).toEqual(['popup', 'drawer', 'page']);
  });

  it('breaks priority ties on mount order (later seq is topmost)', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'first', snapshot: null, priority: 5 });
    registry.register({ key: 'second', snapshot: null, priority: 5 });
    expect(registry.orderedStack().map((f) => f.key)).toEqual(['second', 'first']);
  });

  it('example from Req 11.3 — page/drawer/popup', () => {
    const registry = new ContextRegistry();
    registry.register({ key: 'page', snapshot: null, priority: 0 });
    registry.register({ key: 'drawer', snapshot: null, priority: 1 });
    registry.register({ key: 'popup', snapshot: null, priority: 2 });
    const stack = registry.orderedStack();
    expect(stack[0]?.key).toBe('popup');
    expect(stack[stack.length - 1]?.key).toBe('page');
  });

  it('notifies listeners on every mutation', () => {
    const registry = new ContextRegistry();
    const listener = vi.fn();
    registry.onChange(listener);
    registry.register({ key: 'a', snapshot: 1 });
    registry.update('a', 2);
    registry.unregister('a');
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('onChange returns an unsubscribe function', () => {
    const registry = new ContextRegistry();
    const listener = vi.fn();
    const off = registry.onChange(listener);
    off();
    registry.register({ key: 'a', snapshot: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('update on an unknown key is a no-op', () => {
    const registry = new ContextRegistry();
    const listener = vi.fn();
    registry.onChange(listener);
    registry.update('missing', 42);
    expect(listener).not.toHaveBeenCalled();
    expect(registry.count()).toBe(0);
  });

  it('unregister on an unknown key is a no-op', () => {
    const registry = new ContextRegistry();
    const listener = vi.fn();
    registry.onChange(listener);
    registry.unregister('missing');
    expect(listener).not.toHaveBeenCalled();
  });
});
