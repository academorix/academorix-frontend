/**
 * @file index.ts
 * @module providers/notification
 *
 * @description
 * Re-exports the HeroUI-backed notification provider. It is transport-agnostic
 * (the same toasts render in mock and REST modes), so there is no env switch.
 */

export { notificationProvider } from "@/providers/notification/notification-provider";
