/**
 * @fileoverview KeyboardCatalogTrigger — icon button opening the catalog.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { useI18n } from "@stackra/i18n/react";
import { Button } from "@stackra/ui/react";
import { type ReactElement } from "react";

import { useKeyboardCatalog } from "../../hooks/use-keyboard-catalog/use-keyboard-catalog.hook";

import type { KeyboardCatalogTriggerProps } from "../../interfaces/keyboard-catalog-trigger-props.interface";

/**
 * Icon button that opens the {@link KeyboardCatalog} modal.
 *
 * `ariaLabel` falls back to the localized
 * `kbd.components.keyboard_catalog_trigger.aria_label` catalog entry
 * so screen readers speak the tenant/locale-appropriate label instead
 * of a hardcoded English string.
 */
export function KeyboardCatalogTrigger({
  className,
  ariaLabel,
  icon,
}: KeyboardCatalogTriggerProps): ReactElement {
  const { t } = useI18n();
  const { open } = useKeyboardCatalog();
  const resolvedAriaLabel = ariaLabel ?? t("kbd.components.keyboard_catalog_trigger.aria_label");
  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      onPress={open}
      className={className}
      aria-label={resolvedAriaLabel}
      data-shortcut={JSON.stringify({ shift: true, key: "?" })}
      data-shortcut-description={resolvedAriaLabel}
    >
      {icon ?? <DefaultIcon />}
    </Button>
  );
}

/**
 * Minimal keyboard icon — avoids pulling lucide-react.
 */
function DefaultIcon(): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M6 9h.01" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
      <path d="M18 9h.01" />
      <path d="M6 13h12" />
    </svg>
  );
}
