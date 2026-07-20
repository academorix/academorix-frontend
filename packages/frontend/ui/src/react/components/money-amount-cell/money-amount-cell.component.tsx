/**
 * @file money-amount-cell.component.tsx
 * @module @stackra/ui/react/components/money-amount-cell
 * @description Formatted currency display for data tables.
 *   Handles locale-aware formatting, smallest-unit conversion, and strikethrough pricing.
 */

"use client";

import React, { useMemo } from "react";

import type { MoneyAmountCellProps } from "./money-amount-cell.interface";

/**
 * MoneyAmountCell — Locale-aware currency display for tables.
 *
 * Renders a formatted money amount with proper currency symbol,
 * decimal places, and locale formatting. Supports strikethrough
 * for original prices when a discount is applied.
 *
 * @param props - Component props.
 * @returns The formatted currency element.
 *
 * @example
 * ```tsx
 * // $15.99 (amount in cents)
 * <MoneyAmountCell amount={1599} currencyCode="USD" />
 *
 * // $15.99 with original price $19.99 struck through
 * <MoneyAmountCell amount={1599} currencyCode="USD" originalAmount={1999} />
 *
 * // SAR 150.00 (amount as decimal, not cents)
 * <MoneyAmountCell amount={150} currencyCode="SAR" isSmallestUnit={false} locale="ar-SA" />
 * ```
 */
export const MoneyAmountCell = React.memo(function MoneyAmountCell({
  amount,
  currencyCode,
  locale = "en-US",
  isSmallestUnit = true,
  className,
  originalAmount,
}: MoneyAmountCellProps): React.ReactElement {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, currencyCode],
  );

  const displayAmount = isSmallestUnit ? amount / 100 : amount;
  const formattedAmount = formatter.format(displayAmount);

  const formattedOriginal = useMemo(() => {
    if (originalAmount == null) return null;
    const displayOriginal = isSmallestUnit ? originalAmount / 100 : originalAmount;

    return formatter.format(displayOriginal);
  }, [originalAmount, isSmallestUnit, formatter]);

  return (
    <span
      className={`inline-flex items-center gap-2 tabular-nums ${className ?? ""}`.trim()}
      data-component="money-amount-cell"
    >
      {formattedOriginal && (
        <span aria-label="Original price" className="text-foreground-400 line-through">
          {formattedOriginal}
        </span>
      )}
      <span className="font-medium">{formattedAmount}</span>
    </span>
  );
});

MoneyAmountCell.displayName = "MoneyAmountCell";
