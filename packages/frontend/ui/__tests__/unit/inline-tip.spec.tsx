// @vitest-environment jsdom
/**
 * @file inline-tip.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<InlineTip>` — the form-level callout
 *   backed by the HeroUI v3 Alert compound. Covers title/description
 *   rendering, variant mapping smoke, `className` passthrough, and
 *   dismiss flow (close button removes the tip and fires `onDismiss`).
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InlineTip } from "@/react/components/inline-tip/inline-tip.component";
import type { InlineTipVariant } from "@/react/components/inline-tip/inline-tip.interface";

afterEach(cleanup);

describe("<InlineTip>", () => {
  it("renders the body children", () => {
    render(<InlineTip>Heads up — this is a tip.</InlineTip>);
    expect(screen.getByText("Heads up — this is a tip.")).toBeDefined();
  });

  it("renders the title when provided", () => {
    render(<InlineTip title="Careful">body</InlineTip>);
    expect(screen.getByText("Careful")).toBeDefined();
  });

  it("omits the title when not provided", () => {
    const { container } = render(<InlineTip>plain body</InlineTip>);
    // The v3 `Alert.Title` slot is a heading — assert no `[role="heading"]`
    // is present when the prop is omitted.
    expect(container.querySelector('[role="heading"]')).toBeNull();
  });

  it('stamps data-component="inline-tip" on the alert root', () => {
    const { container } = render(<InlineTip>body</InlineTip>);
    expect(container.querySelector('[data-component="inline-tip"]')).not.toBeNull();
  });

  it("forwards `className` onto the alert root", () => {
    const { container } = render(<InlineTip className="my-tip">body</InlineTip>);
    const root = container.querySelector('[data-component="inline-tip"]');
    expect(root?.className.includes("my-tip")).toBe(true);
  });

  it.each<InlineTipVariant>(["info", "warning", "error", "success", "tip"])(
    'renders without crashing for variant="%s"',
    (variant) => {
      const { container } = render(<InlineTip variant={variant}>body</InlineTip>);
      expect(container.querySelector('[data-component="inline-tip"]')).not.toBeNull();
    },
  );

  it("renders a dismiss button when dismissible=true", () => {
    render(<InlineTip dismissible>Body</InlineTip>);
    expect(screen.getByRole("button", { name: "Dismiss tip" })).toBeDefined();
  });

  it("hides itself after the dismiss button is pressed", () => {
    render(<InlineTip dismissible>Body content</InlineTip>);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    expect(screen.queryByText("Body content")).toBeNull();
  });

  it("fires onDismiss when dismissed", () => {
    const onDismiss = vi.fn();
    render(
      <InlineTip dismissible onDismiss={onDismiss}>
        Body content
      </InlineTip>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not render a dismiss button when dismissible is false", () => {
    render(<InlineTip>Body</InlineTip>);
    expect(screen.queryByRole("button", { name: "Dismiss tip" })).toBeNull();
  });
});
