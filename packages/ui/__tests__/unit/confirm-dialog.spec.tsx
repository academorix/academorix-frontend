// @vitest-environment jsdom
/**
 * @file confirm-dialog.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<ConfirmDialog>` — the standardised
 *   confirmation dialog for destructive actions. Covers open/closed state
 *   rendering, title and description text, confirm/cancel button labels,
 *   click handlers (`onConfirm`, `onCancel`), async confirm flow with
 *   loading, and variant prop smoke.
 */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "@/react/components/confirm-dialog/confirm-dialog.component";

afterEach(cleanup);

describe("<ConfirmDialog>", () => {
  it("does not render dialog contents when closed", () => {
    render(
      <ConfirmDialog
        description="Really?"
        open={false}
        title="Delete"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    // With `open=false` HeroUI does not mount the dialog contents.
    expect(screen.queryByText("Delete")).toBeNull();
    expect(screen.queryByText("Really?")).toBeNull();
  });

  it("renders title and description when open", () => {
    render(
      <ConfirmDialog
        description="This action cannot be undone."
        open
        title="Delete Product"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Delete Product")).toBeDefined();
    expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  });

  it('uses the default "Confirm" / "Cancel" button labels', () => {
    render(
      <ConfirmDialog
        description="body"
        open
        title="Delete"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  it("renders custom confirm/cancel labels when provided", () => {
    render(
      <ConfirmDialog
        cancelLabel="Nope"
        confirmLabel="Yes, delete"
        description="body"
        open
        title="Delete"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Nope" })).toBeDefined();
  });

  it("invokes onConfirm and closes when the confirm button is clicked", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        description="body"
        open
        title="Delete"
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    });

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledOnce();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("invokes onCancel and closes when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        description="body"
        open
        title="Delete"
        onCancel={onCancel}
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("still closes on cancel even when no onCancel is provided", async () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        description="body"
        open
        title="Delete"
        onConfirm={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders a JSX description when passed as ReactNode", () => {
    render(
      <ConfirmDialog
        description={<span data-testid="rich-desc">Rich content</span>}
        open
        title="Delete"
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("rich-desc")).toBeDefined();
  });

  it("renders without crashing for each variant", () => {
    const variants = ["danger", "warning", "info"] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <ConfirmDialog
          description="body"
          open
          title="Delete"
          variant={variant}
          onConfirm={vi.fn()}
          onOpenChange={vi.fn()}
        />,
      );
      // Just assert the confirm button reachable — HeroUI owns the styling.
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDefined();
      unmount();
    }
  });
});
