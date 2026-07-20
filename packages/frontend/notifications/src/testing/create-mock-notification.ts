/**
 * @file create-mock-notification.ts
 * @module @stackra/notifications/testing
 * @description Factories returning assertable notification mocks —
 *   thin wrappers around the raw mock classes that pipe every
 *   method call through `createAssertableProxy` from `@stackra/testing`.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import type {
  IInAppNotification,
  INotificationPermissionState,
  INotificationPreferences,
  IPushSubscriptionResult,
} from "@/core/interfaces";
import { MockInAppNotificationCentre } from "./mock-in-app-notification-centre";
import { MockNotificationManager } from "./mock-notification-manager";
import { MockNotificationPreferences } from "./mock-notification-preferences";
import { MockPushSubscriptionAdapter } from "./mock-push-subscription-adapter";
import { MockPushSubscriptionManager } from "./mock-push-subscription-manager";
import { MockSnoozeStore } from "./mock-snooze-store";

/** Options accepted by {@link createMockNotificationManager}. */
export interface ICreateMockNotificationManagerOptions {
  /** Seed the permission state. */
  readonly permission?: INotificationPermissionState;
}

/** Options accepted by {@link createMockInAppNotificationCentre}. */
export interface ICreateMockInAppNotificationCentreOptions {
  /** Seed the centre with pre-existing items. */
  readonly items?: readonly IInAppNotification[];
}

/** Options accepted by {@link createMockPushSubscriptionManager}. */
export interface ICreateMockPushSubscriptionManagerOptions {
  /** Seed the manager with a canned subscription. */
  readonly subscription?: IPushSubscriptionResult | null;
}

/** Options accepted by {@link createMockPushSubscriptionAdapter}. */
export interface ICreateMockPushSubscriptionAdapterOptions {
  /** Which platform to advertise. */
  readonly platform?: "web" | "native";
  /** Seed permission state. */
  readonly permission?: NotificationPermission;
  /** Seed subscription. */
  readonly subscription?: IPushSubscriptionResult | null;
}

/** Options accepted by {@link createMockNotificationPreferences}. */
export interface ICreateMockNotificationPreferencesOptions {
  /** Seed the preferences object. */
  readonly preferences?: INotificationPreferences;
}

/**
 * Build an assertable {@link MockNotificationManager}.
 *
 * @example
 * ```ts
 * const manager = createMockNotificationManager({
 *   permission: { supported: true, permission: 'granted' },
 * });
 * await manager.requestPermission();
 * expect(manager.$.wasCalled('requestPermission')).toBe(true);
 * ```
 */
export function createMockNotificationManager(
  options: ICreateMockNotificationManagerOptions = {},
): AssertableProxy<MockNotificationManager> {
  return createAssertableProxy(new MockNotificationManager(options));
}

/**
 * Build an assertable {@link MockInAppNotificationCentre}.
 */
export function createMockInAppNotificationCentre(
  options: ICreateMockInAppNotificationCentreOptions = {},
): AssertableProxy<MockInAppNotificationCentre> {
  return createAssertableProxy(new MockInAppNotificationCentre(options));
}

/**
 * Build an assertable {@link MockPushSubscriptionManager}.
 */
export function createMockPushSubscriptionManager(
  options: ICreateMockPushSubscriptionManagerOptions = {},
): AssertableProxy<MockPushSubscriptionManager> {
  return createAssertableProxy(new MockPushSubscriptionManager(options));
}

/**
 * Build an assertable {@link MockPushSubscriptionAdapter}.
 *
 * @example
 * ```ts
 * const adapter = createMockPushSubscriptionAdapter({ platform: 'web' });
 * await adapter.subscribe();
 * expect(adapter.$.wasCalled('subscribe')).toBe(true);
 * ```
 */
export function createMockPushSubscriptionAdapter(
  options: ICreateMockPushSubscriptionAdapterOptions = {},
): AssertableProxy<MockPushSubscriptionAdapter> {
  return createAssertableProxy(new MockPushSubscriptionAdapter(options));
}

/**
 * Build an assertable {@link MockNotificationPreferences}.
 */
export function createMockNotificationPreferences(
  options: ICreateMockNotificationPreferencesOptions = {},
): AssertableProxy<MockNotificationPreferences> {
  return createAssertableProxy(new MockNotificationPreferences(options));
}

/**
 * Build an assertable {@link MockSnoozeStore}.
 */
export function createMockSnoozeStore(): AssertableProxy<MockSnoozeStore> {
  return createAssertableProxy(new MockSnoozeStore());
}
