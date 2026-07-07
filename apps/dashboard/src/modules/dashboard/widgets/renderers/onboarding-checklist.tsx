/**
 * @file onboarding-checklist.tsx
 * @module modules/dashboard/widgets/renderers/onboarding-checklist
 *
 * @description
 * Thin re-export shim for backwards compatibility. The plan-compliant
 * implementation moved to
 * {@link "@/modules/dashboard/widgets/onboarding-checklist/index" `widgets/onboarding-checklist/`}
 * — a compact top-right widget with an expandable Drawer, aligned with
 * ONBOARDING_PLAN.md §5.
 *
 * Kept here so `dashboard-page.tsx` (which imports from this path) picks
 * up the new implementation without any consumer edit. When we're ready
 * to consolidate, `pages/dashboard-page.tsx` can switch its import to
 * `@/modules/dashboard/widgets/onboarding-checklist` and this file can
 * disappear.
 */

export { default } from "@/modules/dashboard/widgets/onboarding-checklist";
