// @vitest-environment jsdom
/**
 * @file progress-tabs.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for the `<ProgressTabs>` compound — the
 *   multi-step stepper backing product-wizard style flows. Covers the
 *   uncontrolled `defaultSelectedKey`, controlled `selectedKey`, panel
 *   visibility flipping to match the active key, trigger labels, and
 *   `className` passthrough.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProgressTabs } from "@/react/components/progress-tabs/progress-tabs.component";

afterEach(cleanup);

describe("<ProgressTabs>", () => {
  it("renders every trigger label", () => {
    render(
      <ProgressTabs defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="organize">Organize</ProgressTabs.Trigger>
        </ProgressTabs.List>
      </ProgressTabs>,
    );
    expect(screen.getByText("Details")).toBeDefined();
    expect(screen.getByText("Organize")).toBeDefined();
  });

  it("renders only the panel matching the active key", () => {
    render(
      <ProgressTabs defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="organize">Organize</ProgressTabs.Trigger>
        </ProgressTabs.List>
        <ProgressTabs.Content value="details">
          <span data-testid="details-content">details panel</span>
        </ProgressTabs.Content>
        <ProgressTabs.Content value="organize">
          <span data-testid="organize-content">organize panel</span>
        </ProgressTabs.Content>
      </ProgressTabs>,
    );
    expect(screen.getByTestId("details-content")).toBeDefined();
    expect(screen.queryByTestId("organize-content")).toBeNull();
  });

  it("switches the visible panel when `selectedKey` changes (controlled mode)", () => {
    const { rerender } = render(
      <ProgressTabs selectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="organize">Organize</ProgressTabs.Trigger>
        </ProgressTabs.List>
        <ProgressTabs.Content value="details">details panel</ProgressTabs.Content>
        <ProgressTabs.Content value="organize">organize panel</ProgressTabs.Content>
      </ProgressTabs>,
    );
    expect(screen.getByText("details panel")).toBeDefined();

    rerender(
      <ProgressTabs selectedKey="organize">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="organize">Organize</ProgressTabs.Trigger>
        </ProgressTabs.List>
        <ProgressTabs.Content value="details">details panel</ProgressTabs.Content>
        <ProgressTabs.Content value="organize">organize panel</ProgressTabs.Content>
      </ProgressTabs>,
    );
    expect(screen.queryByText("details panel")).toBeNull();
    expect(screen.getByText("organize panel")).toBeDefined();
  });

  it("does not call `onSelectionChange` on initial mount", () => {
    const onSelectionChange = vi.fn();
    render(
      <ProgressTabs defaultSelectedKey="details" onSelectionChange={onSelectionChange}>
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
        </ProgressTabs.List>
      </ProgressTabs>,
    );
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('stamps data-component="progress-tabs" on the root', () => {
    const { container } = render(
      <ProgressTabs defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
        </ProgressTabs.List>
      </ProgressTabs>,
    );
    expect(container.querySelector('[data-component="progress-tabs"]')).not.toBeNull();
  });

  it("forwards `className` on the root", () => {
    const { container } = render(
      <ProgressTabs className="my-tabs" defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
        </ProgressTabs.List>
      </ProgressTabs>,
    );
    const root = container.querySelector('[data-component="progress-tabs"]');
    expect(root?.className.includes("my-tabs")).toBe(true);
  });

  it('renders the list with the supplied aria-label and role="tablist"', () => {
    render(
      <ProgressTabs defaultSelectedKey="details">
        <ProgressTabs.List aria-label="Create product">
          <ProgressTabs.Trigger value="details">Details</ProgressTabs.Trigger>
        </ProgressTabs.List>
      </ProgressTabs>,
    );
    expect(screen.getByRole("tablist", { name: "Create product" })).toBeDefined();
  });
});
