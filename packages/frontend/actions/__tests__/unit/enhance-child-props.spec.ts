/**
 * @file enhance-child-props.spec.ts
 * @module @stackra/actions/__tests__/unit
 * @description Unit tests for the pure `enhanceActionChildProps`
 *   helper — verifies event-prop injection, handler chaining, and
 *   pending forwarding semantics without needing a React renderer.
 */

import { createElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { IActionDescriptor, IActionResponse } from '@stackra/contracts';

import { enhanceActionChildProps } from '@/core/components/action/enhance-child-props.util';
import type { IActionChildProps } from '@/core/components/action/action.interface';

/** Minimal descriptor used across every case. */
const DESCRIPTOR: IActionDescriptor = { kind: 'toast' };

/** Standard resolved response used by the fake dispatcher. */
const RESPONSE: IActionResponse = { success: true };

/**
 * Build a fake child `ReactElement` carrying arbitrary props. `createElement`
 * on a lowercase tag produces a fully-typed element without needing a
 * renderer or JSX runtime.
 */
function makeChild(props: IActionChildProps): ReactElement<IActionChildProps> {
  return createElement('button', props) as ReactElement<IActionChildProps>;
}

describe('enhanceActionChildProps', () => {
  it('injects a handler under the default `onPress` event prop', async () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({});
    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false);

    expect(enhanced).toHaveProperty('onPress');
    expect(typeof enhanced.onPress).toBe('function');

    await (enhanced.onPress as () => Promise<void>)();
    expect(dispatch).toHaveBeenCalledWith(DESCRIPTOR, undefined);
  });

  it('honors an explicit `eventProp` override', async () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({});
    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false, {
      eventProp: 'onClick',
    });

    expect(typeof enhanced.onClick).toBe('function');
    expect(enhanced.onPress).toBeUndefined();
  });

  it("chains the child's existing handler before the injected one", async () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const order: string[] = [];
    const existing = vi.fn(() => order.push('existing'));
    const child = makeChild({ onPress: existing });

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false);
    await (enhanced.onPress as () => Promise<void>)();

    expect(existing).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledOnce();
    // The existing handler must fire before the injected dispatch so a
    // caller's synchronous work runs prior to the async round-trip.
    expect(order).toEqual(['existing']);
  });

  it('forwards `isPending` when the child acknowledges the prop', () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({ isPending: false });

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, true);
    expect(enhanced.isPending).toBe(true);
  });

  it('leaves `isPending` off when the child never mentions it', () => {
    // Prevents React from warning about unknown DOM props (`isPending`
    // isn't a real HTML attribute).
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({});

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, true);
    expect(enhanced).not.toHaveProperty('isPending');
  });

  it('preserves an existing pending state when forwarding', () => {
    // When the child already advertises `isPending: true` (e.g. its own
    // async work), the OR-merge ensures the child stays pending.
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({ isPending: true });

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false);
    expect(enhanced.isPending).toBe(true);
  });

  it('skips pending injection when `forwardPending` is disabled', () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({ isPending: false });

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, true, {
      forwardPending: false,
    });
    expect(enhanced.isPending).toBe(false);
  });

  it('forwards caller `context` to the dispatcher', async () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({});
    const context = { record: { id: 42 } };

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false, {
      context,
    });
    await (enhanced.onPress as () => Promise<void>)();

    expect(dispatch).toHaveBeenCalledWith(DESCRIPTOR, context);
  });

  it('invokes `onDone` after every dispatch with the response + descriptor', async () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({});
    const onDone = vi.fn();

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false, {
      onDone,
    });
    await (enhanced.onPress as () => Promise<void>)();

    expect(onDone).toHaveBeenCalledWith(RESPONSE, DESCRIPTOR);
  });

  it('preserves every other child prop untouched', () => {
    const dispatch = vi.fn(async () => RESPONSE);
    const child = makeChild({
      className: 'my-btn',
      'aria-label': 'Save',
      // Custom props on the child element pass through verbatim.
      'data-testid': 'save-button',
    } as IActionChildProps);

    const enhanced = enhanceActionChildProps(child, DESCRIPTOR, dispatch, false);
    expect(enhanced.className).toBe('my-btn');
    expect(enhanced['aria-label']).toBe('Save');
    expect(enhanced['data-testid']).toBe('save-button');
  });
});
