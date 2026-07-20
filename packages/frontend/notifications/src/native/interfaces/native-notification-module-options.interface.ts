/**
 * @file native-notification-module-options.interface.ts
 * @module @stackra/notifications/native/interfaces
 * @description Root configuration shape for
 *   `NativeNotificationModule.forRoot`.
 *
 *   Mirrors {@link INotificationModuleOptions} but replaces the
 *   `push` field with an Expo-shaped block. The two shapes cannot
 *   share a type (`vapidPublicKey` vs. `projectId`), so this
 *   interface only overlaps on the shared fields (`centre`,
 *   `defaultStack`) — no `extends` relationship.
 *
 *   Composite-family grouping (see `code-standards.md`): the outer
 *   options + inner Expo push shape both live in this file because
 *   the inner shape is only used in service of the outer.
 */

import type { IInAppNotificationCentreConfig } from "@/core/interfaces";
import type { IExpoPushConfig } from "./expo-push-config.interface";

/**
 * Native (Expo) push configuration.
 *
 * When present, `NativeNotificationModule.forRoot` binds
 * {@link EXPO_PUSH_CONFIG} to this value so the
 * {@link ExpoPushTokenAdapter} can pick up the caller's project /
 * experience ids without a separate config file.
 */
export interface INativeNotificationPushOptions extends IExpoPushConfig {
  /**
   * Overrides the outer's `defaultStack` when supplied.
   *
   * Not used by the module directly — kept as an ergonomic hook so
   * consumers can enable the OS-notification channel without
   * having to also set the outer `defaultStack`.
   */
  readonly defaultStack?: readonly string[];
}

/**
 * Root options accepted by `NativeNotificationModule.forRoot`.
 *
 * The `push` field carries Expo-flavoured config; the outer
 * `NotificationModule.forRoot` is passed the same options minus
 * `push` (Web Push would reject an object without `vapidPublicKey`).
 */
export interface INativeNotificationModuleOptions {
  /** In-app centre configuration. */
  readonly centre?: IInAppNotificationCentreConfig;
  /**
   * Native (Expo) push configuration. When omitted the module still
   * wires the received-notification listener + the OS-notification
   * driver — token retrieval is opt-in.
   */
  readonly push?: INativeNotificationPushOptions;
  /**
   * Channel ids the manager dispatches to when
   * `dispatch(payload)` is called without a `channels` override.
   *
   * @default ['in-app']
   */
  readonly defaultStack?: readonly string[];
}
