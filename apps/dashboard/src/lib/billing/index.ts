/**
 * @file index.ts
 * @module lib/billing
 *
 * @description
 * Public barrel for the billing utilities: the identity-derived hooks, the
 * presentational subscription-status helpers, and the live plans catalog
 * hook (with static fallback while the backend catches up).
 */

export * from "@/lib/billing/subscription-status";
export * from "@/lib/billing/use-plans";
export * from "@/lib/billing/use-subscription";
