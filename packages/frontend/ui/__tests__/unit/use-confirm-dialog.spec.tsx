// @vitest-environment jsdom
/**
 * @file use-confirm-dialog.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `useConfirmDialog` — verifies the
 *   imperative `confirm(...)` returning a boolean promise, the
 *   dialogProps shape, and the resolve paths (confirm → true,
 *   cancel → false, external close → false).
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useConfirmDialog } from "@/react/hooks/use-confirm-dialog/use-confirm-dialog.hook";

afterEach(cleanup);

describe("useConfirmDialog", () => {
  it("returns { confirm, dialogProps } with sensible defaults", () => {
    const { result } = renderHook(() => useConfirmDialog());
    expect(typeof result.current.confirm).toBe("function");
    expect(result.current.dialogProps.open).toBe(false);
    expect(result.current.dialogProps.variant).toBe("danger");
    expect(result.current.dialogProps.confirmLabel).toBe("Confirm");
    expect(result.current.dialogProps.cancelLabel).toBe("Cancel");
  });

  it("opens the dialog and reflects the options on dialogProps", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      void result.current.confirm({
        title: "Delete Product",
        description: "Really?",
        variant: "warning",
        confirmLabel: "Yes",
        cancelLabel: "No",
      });
    });

    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.title).toBe("Delete Product");
    expect(result.current.dialogProps.description).toBe("Really?");
    expect(result.current.dialogProps.variant).toBe("warning");
    expect(result.current.dialogProps.confirmLabel).toBe("Yes");
    expect(result.current.dialogProps.cancelLabel).toBe("No");
  });

  it("resolves to true when onConfirm fires", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmed: boolean | undefined;
    await act(async () => {
      const promise = result.current.confirm({ title: "t", description: "d" });
      await result.current.dialogProps.onConfirm();
      confirmed = await promise;
    });

    expect(confirmed).toBe(true);
  });

  it("resolves to false when onCancel fires", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmed: boolean | undefined;
    await act(async () => {
      const promise = result.current.confirm({ title: "t", description: "d" });
      result.current.dialogProps.onCancel();
      confirmed = await promise;
    });

    expect(confirmed).toBe(false);
  });

  it("resolves to false when the dialog is closed externally via onOpenChange(false)", async () => {
    const { result } = renderHook(() => useConfirmDialog());

    let confirmed: boolean | undefined;
    await act(async () => {
      const promise = result.current.confirm({ title: "t", description: "d" });
      result.current.dialogProps.onOpenChange(false);
      confirmed = await promise;
    });

    expect(confirmed).toBe(false);
    expect(result.current.dialogProps.open).toBe(false);
  });

  it("re-opens the dialog on a second confirm() call", () => {
    const { result } = renderHook(() => useConfirmDialog());

    act(() => {
      void result.current.confirm({ title: "First", description: "x" });
    });
    expect(result.current.dialogProps.title).toBe("First");

    act(() => {
      result.current.dialogProps.onOpenChange(false);
    });
    expect(result.current.dialogProps.open).toBe(false);

    act(() => {
      void result.current.confirm({ title: "Second", description: "x" });
    });
    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.title).toBe("Second");
  });
});
