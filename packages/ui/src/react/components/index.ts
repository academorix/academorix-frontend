/**
 * @file index.ts
 * @module @stackra/ui/react/components
 * @description Barrel export for all custom UI components.
 */

// ============================================================================
// Layout Components
// ============================================================================
export { FocusModal } from "./focus-modal";
export type {
  FocusModalProps,
  FocusModalHeaderProps,
  FocusModalBodyProps,
  FocusModalFooterProps,
} from "./focus-modal";

export { SectionContainer } from "./section-container";
export type { SectionContainerProps } from "./section-container";

// ============================================================================
// Navigation & Progress
// ============================================================================
export { ProgressTabs } from "./progress-tabs";
export type {
  ProgressTabsProps,
  ProgressTabsListProps,
  ProgressTabsTriggerProps,
  ProgressTabsContentProps,
  ProgressStatus,
} from "./progress-tabs";

export { ProgressAccordion } from "./progress-accordion";
export type {
  ProgressAccordionProps,
  ProgressAccordionItemProps,
  AccordionSectionStatus,
} from "./progress-accordion";

// ============================================================================
// Data Display
// ============================================================================
export { StatusBadge } from "./status-badge";
export type { StatusBadgeProps, StatusBadgeColor } from "./status-badge";

export { MoneyAmountCell } from "./money-amount-cell";
export type { MoneyAmountCellProps } from "./money-amount-cell";

export { JsonViewSection } from "./json-view-section";
export type { JsonViewSectionProps } from "./json-view-section";

// ============================================================================
// Feedback & Dialogs
// ============================================================================
export { InlineTip } from "./inline-tip";
export type { InlineTipProps, InlineTipVariant } from "./inline-tip";

export { ConfirmDialog } from "./confirm-dialog";
export type { ConfirmDialogProps, ConfirmDialogVariant } from "./confirm-dialog";

// ============================================================================
// File Upload
// ============================================================================
export { FileUpload } from "./file-upload";
export type { FileUploadProps, FileUploadPreviewProps, UploadFile } from "./file-upload";

// ============================================================================
// Auth & Security
// ============================================================================
export { PinLock } from "./pin-lock";
export type { PinLockProps } from "./pin-lock";

export { PatternLock } from "./pattern-lock";
export type { PatternLockProps, Point2D } from "./pattern-lock";

// ============================================================================
// Form Inputs
// ============================================================================
export { PhoneInput } from "./phone-input";
export type { PhoneInputProps, PhoneInputInfo, PhonePickerMode, PhoneCountry } from "./phone-input";
