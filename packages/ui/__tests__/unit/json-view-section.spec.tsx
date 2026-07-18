// @vitest-environment jsdom
/**
 * @file json-view-section.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<JsonViewSection>` — the disclosure-based
 *   JSON viewer for admin detail pages. Covers title rendering, formatted
 *   JSON output, `showCopy` toggle, indentation prop, and `className`
 *   passthrough. Copy-to-clipboard behaviour is exercised by stubbing
 *   `navigator.clipboard.writeText`.
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JsonViewSection } from "@/react/components/json-view-section/json-view-section.component";

beforeEach(() => {
  vi.useFakeTimers();
  // Stub the clipboard API — jsdom does not implement it.
  Object.defineProperty(globalThis.navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("<JsonViewSection>", () => {
  it('renders the default title "Raw Data"', () => {
    render(<JsonViewSection data={{ a: 1 }} />);
    expect(screen.getByText("Raw Data")).toBeDefined();
  });

  it("renders a custom title", () => {
    render(<JsonViewSection data={{ a: 1 }} title="Metadata" />);
    expect(screen.getByText("Metadata")).toBeDefined();
  });

  it("formats the JSON with the default 2-space indentation", () => {
    const { container } = render(<JsonViewSection data={{ a: 1 }} defaultExpanded />);
    const code = container.querySelector("code");
    // The pretty-printed body uses "  " for one level of nesting. We assert
    // the raw `textContent` (RTL's `getByText` normalises whitespace and
    // therefore can't discriminate 2-space vs. 4-space indentation).
    expect(code?.textContent).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it("honours the `indentation` prop", () => {
    const { container } = render(
      <JsonViewSection data={{ a: 1 }} defaultExpanded indentation={4} />,
    );
    const code = container.querySelector("code");
    expect(code?.textContent).toBe(JSON.stringify({ a: 1 }, null, 4));
  });

  it("shows a Copy button by default", () => {
    render(<JsonViewSection data={{ a: 1 }} defaultExpanded />);
    expect(screen.getByRole("button", { name: "Copy JSON" })).toBeDefined();
  });

  it("hides the Copy button when showCopy=false", () => {
    render(<JsonViewSection data={{ a: 1 }} defaultExpanded showCopy={false} />);
    expect(screen.queryByRole("button", { name: "Copy JSON" })).toBeNull();
  });

  it("writes the pretty-printed JSON to the clipboard on Copy press", async () => {
    render(<JsonViewSection data={{ a: 1 }} defaultExpanded />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
    });

    const writeText = (navigator.clipboard as unknown as { writeText: ReturnType<typeof vi.fn> })
      .writeText;
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
  });

  it('shows the "Copied!" label after copying and clears after ~2s', async () => {
    render(<JsonViewSection data={{ a: 1 }} defaultExpanded />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
    });

    // Immediately after clicking, the label flips to "Copied!".
    expect(screen.getByRole("button", { name: "Copied" })).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // …and reverts to "Copy JSON" once the timer resolves.
    expect(screen.getByRole("button", { name: "Copy JSON" })).toBeDefined();
  });

  it("forwards `className` to the disclosure root", () => {
    const { container } = render(<JsonViewSection className="my-view" data={{ a: 1 }} />);
    const root = container.querySelector('[data-component="json-view-section"]');
    // The className prop passes through the disclosure wrapper. Existence
    // check is sufficient — HeroUI owns the exact class composition.
    expect(root).not.toBeNull();
    expect(root?.className.includes("my-view")).toBe(true);
  });
});
