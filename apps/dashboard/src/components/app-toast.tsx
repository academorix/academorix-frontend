/**
 * @file app-toast.tsx
 * @module components/app-toast
 *
 * @description
 * Sonner-inspired custom render for the app's global toast surface.
 * Wires HeroUI's `<Toast.Provider>` children render slot to a card
 * layout with:
 *
 *   • indicator column (spinner when `isLoading`, else the variant
 *     icon) tinted per variant
 *   • body column stacking title + optional description
 *   • trailing action button (via `actionProps` on the `toast()`
 *     call site)
 *   • absolute-positioned close button top-right
 *
 * ## Why a custom render (not the compound default)
 * The default `<Toast>` layout renders a pill with title inline
 * next to the indicator and no room for a stacked description. The
 * user's design system asks for a Sonner-style stacked card — same
 * information density as the reference apps, but expressed through
 * HeroUI Pro's compound render slot instead of a hand-rolled toast
 * runtime, so `toast()`/`toast.success()`/`toast.promise()` keep
 * working with a single wire change at the provider.
 */

import {
  Spinner,
  Toast,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastTitle,
} from "@heroui/react";

import type { ToastContentValue } from "@heroui/react";
import type { QueuedToast } from "react-aria-components";
import type { ReactElement } from "react";

/**
 * The variants HeroUI toasts can carry. Kept as a local alias so
 * the visual map below is exhaustive against the union.
 */
type ToastVariant = NonNullable<ToastContentValue["variant"]>;

/**
 * Per-variant accent classes. Applied to the indicator icon so
 * success/warning/danger read at a glance without dyeing the whole
 * card. The card frame stays neutral for readability.
 *
 * Tailwind's `text-*-soft-foreground` tokens map to the palette's
 * "soft" foreground layer — same tokens Sonner uses for its tinted
 * accents.
 */
const INDICATOR_TINT: Record<ToastVariant, string> = {
  default: "text-muted",
  accent: "text-accent-soft-foreground",
  success: "text-success-soft-foreground",
  warning: "text-warning-soft-foreground",
  danger: "text-danger-soft-foreground",
};

/**
 * Optional matching border tint per variant. Applied on the
 * `border-l` accent bar of the card so the indicator's colour
 * carries visually into the frame without overwhelming the base
 * neutral surface.
 */
const BORDER_ACCENT: Record<ToastVariant, string> = {
  default: "border-l-default",
  accent: "border-l-accent",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
};

/**
 * Custom render for one queued toast. Called by `Toast.Provider`'s
 * children slot on every render pass — pure and stateless.
 *
 * The return type is `ReactElement` (not `ReactNode`) because
 * `Toast.Provider`'s children signature requires a JSX element per
 * toast — an undefined return would drop the whole queue.
 */
export function renderSonnerToast(toastItem: QueuedToast<ToastContentValue>): ReactElement {
  const content = toastItem.content;
  const variant = content.variant ?? "default";
  const indicatorTint = INDICATOR_TINT[variant];
  const borderTint = BORDER_ACCENT[variant];

  return (
    <Toast
      className={[
        // Base card frame — same rhythm as Sonner (rounded, subtle
        // border, elevated shadow, overlay background).
        "border-border bg-overlay text-overlay-foreground",
        "relative w-[380px] max-w-full rounded-xl border shadow-lg",
        // Variant accent bar on the leading edge.
        "border-l-4",
        borderTint,
        // Padding — matches the "card" preset in the design taste
        // guide (p-3 → 12px, then indent for the close button).
        "p-3 pr-9",
      ].join(" ")}
      toast={toastItem}
      variant={variant}
    >
      <ToastContent>
        <div className="flex items-start gap-3">
          {/*
           * WHY the isLoading branch: HeroUI's ToastIndicator picks
           * the variant icon by default, but `toast.promise` and any
           * manual `isLoading: true` call expect a spinner. Render
           * the spinner in the same slot so the card's grid rhythm
           * stays constant across the toast lifecycle.
           */}
          <div
            className={`mt-0.5 flex size-4 shrink-0 items-center justify-center ${indicatorTint}`}
          >
            {content.isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <ToastIndicator className={indicatorTint} variant={variant}>
                {content.indicator}
              </ToastIndicator>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {content.title ? (
              <ToastTitle className="text-sm leading-tight font-medium text-foreground">
                {content.title}
              </ToastTitle>
            ) : null}
            {content.description ? (
              <ToastDescription className="text-xs leading-snug text-muted">
                {content.description}
              </ToastDescription>
            ) : null}
          </div>
          {/*
           * WHY the action inside ToastContent (not as ActionButton
           * outside): Sonner puts the action inline with the copy on
           * the right, whereas HeroUI's compound would slot
           * ActionButton after ToastContent as a sibling. Rendering
           * a compact secondary button here keeps the visual grouping
           * that Sonner users expect.
           */}
          {content.actionProps ? (
            <Toast.ActionButton
              {...content.actionProps}
              className={["shrink-0", content.actionProps.className].filter(Boolean).join(" ")}
            />
          ) : null}
        </div>
      </ToastContent>
      {/*
       * WHY the absolute-positioned close: matches the Sonner card
       * pattern — small ✕ pinned top-right, out of the title's flow.
       * The compound's built-in close would push the title left with
       * a reserved column, which loses the "quiet dismiss" affordance.
       */}
      <Toast.CloseButton className="absolute top-2 right-2 border-none bg-transparent text-muted hover:text-foreground [&>svg]:size-3.5" />
    </Toast>
  );
}
