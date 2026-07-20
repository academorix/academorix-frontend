/**
 * @file index.ts
 * @module @stackra/actions/react/components
 * @description Public API barrel for web-only Action components.
 *
 *   Web-only components depend on `@stackra/ui/react`'s HeroUI DOM
 *   `Button`. Cross-platform components (`<Action>` slot) live under
 *   `../../core/components/`.
 */

export { ActionButton, type IActionButtonProps } from "./action-button.component";
