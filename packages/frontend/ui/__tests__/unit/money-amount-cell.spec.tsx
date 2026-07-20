// @vitest-environment jsdom
/**
 * @file money-amount-cell.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<MoneyAmountCell>` — the currency-formatting
 *   table cell. Covers smallest-unit → decimal conversion, locale-driven
 *   `Intl.NumberFormat` output, strikethrough of `originalAmount`, and
 *   `className` / `data-component` passthrough.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MoneyAmountCell } from "@/react/components/money-amount-cell/money-amount-cell.component";

afterEach(cleanup);

describe("<MoneyAmountCell>", () => {
  it("formats a smallest-unit amount as en-US currency by default", () => {
    render(<MoneyAmountCell amount={1599} currencyCode="USD" />);
    // Intl.NumberFormat output for USD in en-US collapses to "$15.99".
    expect(screen.getByText("$15.99")).toBeDefined();
  });

  it("treats the amount as a decimal when isSmallestUnit=false", () => {
    render(<MoneyAmountCell amount={150} currencyCode="USD" isSmallestUnit={false} />);
    expect(screen.getByText("$150.00")).toBeDefined();
  });

  it("renders both original and current amounts when originalAmount is set", () => {
    render(<MoneyAmountCell amount={1599} currencyCode="USD" originalAmount={1999} />);
    expect(screen.getByText("$15.99")).toBeDefined();
    expect(screen.getByText("$19.99")).toBeDefined();
  });

  it('marks the original price with the aria-label "Original price"', () => {
    render(<MoneyAmountCell amount={1599} currencyCode="USD" originalAmount={1999} />);
    // The strikethrough span carries an accessible label so screen
    // readers can announce it as the pre-discount amount.
    expect(screen.getByLabelText("Original price")).toBeDefined();
  });

  it("respects a custom locale for formatting", () => {
    // German locale uses "." for thousands and "," for decimals, and the
    // Euro sign trails the number.
    render(<MoneyAmountCell amount={150000} currencyCode="EUR" locale="de-DE" />);
    // We assert the display formatter produced a "1.500" or "1500" string,
    // not the exact character-for-character output — Intl output varies
    // by ICU version. The core invariant is the amount converted to 1500.00.
    const rendered = screen.getByText(/1\.500,00|1\.500,00 €|1\.500,00 EUR/);
    expect(rendered).toBeDefined();
  });

  it('stamps data-component="money-amount-cell" on the root span', () => {
    const { container } = render(<MoneyAmountCell amount={100} currencyCode="USD" />);
    expect(container.querySelector('[data-component="money-amount-cell"]')).not.toBeNull();
  });

  it("forwards `className` to the root span", () => {
    const { container } = render(
      <MoneyAmountCell amount={100} className="my-cell" currencyCode="USD" />,
    );
    const root = container.querySelector('[data-component="money-amount-cell"]');
    expect(root?.className.includes("my-cell")).toBe(true);
  });
});
