/**
 * @file index.ts
 * @module @stackra/notifications
 * @description Root barrel. Prefer the subpath entries:
 *   - `@stackra/notifications` (core DI + services + tokens)
 *   - `@stackra/notifications/push` (Web Push subscription manager)
 *   - `@stackra/notifications/react` (web hooks + components)
 *   - `@stackra/notifications/native` (React Native adapters + module)
 *   - `@stackra/notifications/testing` (mocks + factories)
 */

export * from "./core";
