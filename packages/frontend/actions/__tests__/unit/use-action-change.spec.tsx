// @vitest-environment jsdom
/**
 * @file use-action-change.spec.tsx
 * @module @stackra/actions/__tests__/unit
 * @description Behavioural tests for {@link useActionChange} — verifies
 *   the caller-supplied mapper produces the dispatched descriptor for
 *   each `onChange` value.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { IActionDescriptor, IActionResponse } from "@stackra/contracts";

import { useActionChange } from "@/core/hooks/use-action-change";

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

interface ISetStateAction extends IActionDescriptor<"setState"> {
  readonly path: string;
  readonly value: unknown;
}

describe("useActionChange", () => {
  it("dispatches the mapper output on onChange", async () => {
    const base: ISetStateAction = { kind: "setState", path: "x.y", value: null };
    const { result } = renderHook(() =>
      useActionChange<string, ISetStateAction>(base, (value, b) => ({ ...b, value })),
    );

    await act(async () => {
      await result.current.onChange("hello");
    });

    expect(mockDispatch.mock.calls[0]?.[0]).toEqual({
      kind: "setState",
      path: "x.y",
      value: "hello",
    });
  });

  it("passes the same base to every mapper invocation", async () => {
    const base: ISetStateAction = { kind: "setState", path: "x.y", value: null };
    const mapper = vi.fn((value: string, b: ISetStateAction) => ({ ...b, value }));
    const { result } = renderHook(() => useActionChange<string, ISetStateAction>(base, mapper));

    await act(async () => {
      await result.current.onChange("a");
    });
    await act(async () => {
      await result.current.onChange("b");
    });

    expect(mapper).toHaveBeenCalledTimes(2);
    expect(mapper.mock.calls[0]?.[1]).toBe(base);
    expect(mapper.mock.calls[1]?.[1]).toBe(base);
  });
});
