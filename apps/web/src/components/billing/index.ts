/**
 * @file index.ts
 * @module components/billing
 *
 * @description
 * Public barrel for shared billing UI: the global subscription banner and the
 * quota meter component. Feature modules read these instead of re-implementing
 * the presentation on top of `useSubscription()` / `useQuotaFor()`.
 */

export { QuotaMeter } from "@/components/billing/quota-meter";
export { SubscriptionBanner } from "@/components/billing/subscription-banner";
