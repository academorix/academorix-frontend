/**
 * @file inline-tip.component.tsx
 * @module @stackra/ui/react/components/inline-tip
 * @description Form-level informational callout for tips, warnings, and errors.
 *   Renders as a styled HeroUI v3 Alert for contextual in-form guidance.
 *
 *   v3 compliance:
 *   - Uses the `status` prop (not the v2 `color` prop). Valid statuses are
 *     `default | accent | success | warning | danger` — there is no `'primary'`
 *     and no `'info'` in v3.
 *   - The v2 `variant="soft"` prop is removed; v3 Alert has no `variant` prop.
 *   - Compound children: `Alert.Indicator`, `Alert.Content`, `Alert.Title`,
 *     `Alert.Description`. The indicator renders the status icon.
 */

"use client";

import { Alert, CloseButton } from "@heroui/react";
import React, { useState, useCallback } from "react";

import type { InlineTipProps, InlineTipVariant } from "./inline-tip.interface";

/** Map variant to HeroUI v3 Alert `status` prop value. */
const variantStatusMap: Record<
  InlineTipVariant,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  info: "accent",
  warning: "warning",
  error: "danger",
  success: "success",
  tip: "default",
};

/**
 * InlineTip — Contextual callout for form-level guidance.
 *
 * Use within forms to highlight important information, tips,
 * warnings, or validation errors at the section level. Renders a
 * HeroUI v3 Alert with the `status` prop (mapped from `variant`),
 * a leading `Alert.Indicator` for the status icon, and the compound
 * `Alert.Content` / `Alert.Title` / `Alert.Description` slots.
 *
 * @param props - Component props.
 * @returns The inline tip element.
 *
 * @example
 * ```tsx
 * <InlineTip variant="warning" title="Heads up">
 *   Changing the handle will break existing links to this page.
 * </InlineTip>
 *
 * <InlineTip variant="info">
 *   Prices will be automatically converted using the store's currency rate.
 * </InlineTip>
 * ```
 */
export const InlineTip = React.memo(function InlineTip({
  variant = "info",
  title,
  children,
  className,
  dismissible = false,
  onDismiss,
}: InlineTipProps): React.ReactElement | null {
  const [visible, setVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <Alert
      className={`text-sm ${className ?? ""}`.trim()}
      data-component="inline-tip"
      status={variantStatusMap[variant]}
    >
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title>{title}</Alert.Title>}
        <Alert.Description>{children}</Alert.Description>
      </Alert.Content>
      {dismissible && <CloseButton aria-label="Dismiss tip" onPress={handleDismiss} />}
    </Alert>
  );
});

InlineTip.displayName = "InlineTip";
