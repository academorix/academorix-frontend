/**
 * @file money-amount-cell.interface.ts
 * @module @stackra/ui/react/components/money-amount-cell
 * @description Props interfaces for the MoneyAmountCell component.
 */

// ============================================================================
// Component Props
// ============================================================================

/** Props for the MoneyAmountCell component. */
export interface MoneyAmountCellProps {
  /** Numeric amount in the currency's smallest unit (cents) or as decimal. */
  amount: number;

  /** ISO 4217 currency code (e.g., 'USD', 'EUR', 'SAR'). */
  currencyCode: string;

  /** Locale for formatting (defaults to 'en-US'). */
  locale?: string;

  /** Whether the amount is in the smallest unit (cents). Defaults to true. */
  isSmallestUnit?: boolean;

  /** Additional CSS classes for the cell wrapper. */
  className?: string;

  /** Original amount before discount (renders as strikethrough). */
  originalAmount?: number;
}
