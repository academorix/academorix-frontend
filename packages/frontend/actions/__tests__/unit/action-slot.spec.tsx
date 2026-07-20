// @vitest-environment jsdom
/**
 * @file action-slot.spec.tsx
 * @module @stackra/actions/__tests__/unit
 * @description Behavioural tests for the `<Action>` polymorphic slot —
 *   verifies event-prop injection, child handler chaining, and pending
 *   propagation from the underlying dispatch.
 */

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IActionDescriptor, IActionResponse } from "@stackra/contracts";

import { Action } from "@/core/components/action";

const { mockDispatch, setDispatch } = vi.hoisted(() => {
  let impl: (d: IActionDescriptor, ctx?: unknown) => Promise<IActionResponse> = async () => ({
    success: true,
  });
  return {
    mockDispatch: vi.fn((descriptor: IActionDescriptor, ctx?: unknown) => impl(descriptor, ctx)),
    setDispatch: (next: (d: IActionDescriptor, ctx?: unknown) => Promise<IActionResponse>) => {
      impl = next;
    },
  };
});

vi.mock("@stackra/container/react", () => ({
  useInject: () => ({ dispatch: mockDispatch }),
}));

afterEach(() => {
  cleanup();
  mockDispatch.mockClear();
  setDispatch(async () => ({ success: true }));
});

describe("<Action>", () => {
  it('injects onClick when eventProp="onClick" and fires dispatch on click', async () => {
    const { getByRole } = render(
      <Action action={{ kind: "toast" }} eventProp="onClick">
        <button type="button">Save</button>
      </Action>,
    );

    await act(async () => {
      fireEvent.click(getByRole("button"));
    });

    expect(mockDispatch).toHaveBeenCalledOnce();
    expect(mockDispatch.mock.calls[0]?.[0]).toEqual({ kind: "toast" });
  });

  it("chains an existing child handler before the injected dispatch", async () => {
    const existing = vi.fn();
    const { getByRole } = render(
      <Action action={{ kind: "toast" }} eventProp="onClick">
        <button type="button" onClick={existing}>
          Save
        </button>
      </Action>,
    );

    await act(async () => {
      fireEvent.click(getByRole("button"));
    });

    expect(existing).toHaveBeenCalledOnce();
    expect(mockDispatch).toHaveBeenCalledOnce();
  });

  it("invokes onDone with response + descriptor after each dispatch", async () => {
    setDispatch(async () => ({ success: true, data: 42 }));
    const onDone = vi.fn();
    const { getByRole } = render(
      <Action action={{ kind: "toast" }} eventProp="onClick" onDone={onDone}>
        <button type="button">Save</button>
      </Action>,
    );

    await act(async () => {
      fireEvent.click(getByRole("button"));
    });

    expect(onDone).toHaveBeenCalledWith({ success: true, data: 42 }, { kind: "toast" });
  });

  it("throws when passed no children (Children.only contract)", () => {
    expect(() =>
      render(
        // @ts-expect-error — intentionally omit children to hit the guard.
        <Action action={{ kind: "toast" }} />,
      ),
    ).toThrow();
  });

  it("throws when passed multiple children", () => {
    expect(() =>
      render(
        <Action action={{ kind: "toast" }}>
          <button type="button">A</button>
          <button type="button">B</button>
        </Action>,
      ),
    ).toThrow();
  });

  it("throws on a bare text child (needs a React element)", () => {
    expect(() => render(<Action action={{ kind: "toast" }}>text-child</Action>)).toThrow(
      /single React element child/,
    );
  });
});
