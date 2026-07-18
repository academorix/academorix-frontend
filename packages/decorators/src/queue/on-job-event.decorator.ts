/**
 * @file on-job-event.decorator.ts
 * @module @stackra/decorators/queue
 *
 * @description
 * The `@OnJobEvent(event, queue?)` method decorator — subscribes a
 * method to a queue job lifecycle event
 * (`'completed' | 'failed' | 'active' | …`).
 *
 * Stamps a single {@link IOnJobEventOptions} entry per method under
 * `ON_JOB_EVENT_METADATA_KEY`. Unlike `@OnEvent`, this decorator
 * does NOT stack — each application overwrites the previous.
 */

import {
  ON_JOB_EVENT_METADATA_KEY,
  type IOnJobEventOptions,
  type JobEventType,
} from "@stackra/contracts";

import { createDiscoverableMethodDecorator, createMetadataReader } from "../core";

/**
 * Subscribe a method to a queue job lifecycle event.
 *
 * @param event Job lifecycle event to subscribe to.
 * @param queue Optional queue name to scope the subscription to.
 *   Omit to fire for every queue in the manager.
 *
 * @example
 * ```typescript
 * import { OnJobEvent } from '@stackra/decorators/queue';
 * import { Injectable } from '@stackra/container';
 *
 * @Injectable()
 * export class EmailListener {
 *   @OnJobEvent('completed', 'email')
 *   public onEmailCompleted(job: Job): void { … }
 * }
 * ```
 */
export const OnJobEvent = createDiscoverableMethodDecorator<
  [event: JobEventType, queue?: string],
  IOnJobEventOptions
>(ON_JOB_EVENT_METADATA_KEY, (event, queue) =>
  queue !== undefined ? { event, queue } : { event },
);

/** Reader for `@OnJobEvent(...)` metadata. */
export const onJobEventMetadata =
  createMetadataReader<IOnJobEventOptions>(ON_JOB_EVENT_METADATA_KEY);
