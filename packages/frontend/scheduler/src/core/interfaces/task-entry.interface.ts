/**
 * @file task-entry.interface.ts
 * @module @stackra/scheduler/core/interfaces
 * @description Task entry interface representing a registered scheduled task.
 */

import type { ITaskOptions } from './task-options.interface';

export interface ITaskEntry {
  readonly name: string;
  readonly fn: () => Promise<void>;
  readonly options: ITaskOptions;
  timer?: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
  lastRun?: number;
  isRunning: boolean;
  isPaused: boolean;
  isCron: boolean;
}
