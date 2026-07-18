/**
 * @file scheduler.config.ts
 * @module @stackra/scheduler/config
 * @description Application-level scheduler configuration.
 *   Consumed by `SchedulerModule.forRoot()` at bootstrap.
 */

import { defineConfig } from '@stackra/scheduler';

export const schedulerConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Task Runner
  |--------------------------------------------------------------------------
  |
  | The task runner implementation to use. The built-in DefaultTaskRunner
  | uses setInterval/setTimeout for foreground scheduling. For React Native
  | background tasks, use ExpoTaskRunner from @stackra/react-native-scheduler.
  |
  | Leave undefined to use the built-in DefaultTaskRunner.
  |
  */
  runner: undefined,
});
