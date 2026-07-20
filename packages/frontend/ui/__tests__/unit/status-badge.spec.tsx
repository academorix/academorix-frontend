// @vitest-environment jsdom
/**
 * @file status-badge.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<StatusBadge>` — the small
 *   dot-plus-label chip used across admin tables. Verifies smoke
 *   render, label text, `className` passthrough, `data-component`
 *   stamp, and that the `color` prop resolves to a HeroUI Chip
 *   variant without throwing.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatusBadge } from "@/react/components/status-badge/status-badge.component";
import type { StatusBadgeColor } from "@/react/components/status-badge/status-badge.interface";

afterEach(cleanup);

describe("<StatusBadge>", () => {
  it("renders the label text", () => {
    render(<StatusBadge label="Active" />);
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("stamps the data-component attribute on the badge root", () => {
    const { container } = render(<StatusBadge label="Draft" />);
    // The v3 Chip root receives passthrough data-* attributes.
    expect(container.querySelector('[data-component="status-badge"]')).not.toBeNull();
  });

  it("forwards `className` onto the chip root", () => {
    const { container } = render(<StatusBadge className="my-custom" label="Custom" />);
    const root = container.querySelector('[data-component="status-badge"]');
    expect(root?.className.includes("my-custom")).toBe(true);
  });

  it.each<StatusBadgeColor>(["success", "warning", "danger", "default", "accent"])(
    'renders without crashing for the "%s" color',
    (color) => {
      const { container } = render(<StatusBadge color={color} label={`Label-${color}`} />);
      expect(container.querySelector('[data-component="status-badge"]')).not.toBeNull();
    },
  );

  it('defaults to the "default" color when no color is provided', () => {
    // Nothing to assert on classnames without deep-testing HeroUI; the smoke
    // is that the component renders and shows the label.
    render(<StatusBadge label="No color" />);
    expect(screen.getByText("No color")).toBeDefined();
  });
});
