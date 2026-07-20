/**
 * @file use-scheduler.hook.ts
 * @module @stackra/scheduler/react
 * @description React hook for monitoring scheduled tasks.
 */

import { useState, useCallback } from "react";
import { useInject } from "@stackra/container/react";
import { SCHEDULER_SERVICE } from "@stackra/contracts";
import { SchedulerService } from "@/core/services/scheduler.service";
import type { IScheduledTask } from "@/core/interfaces";

/**
 * Return type of the `useScheduler` hook.
 */
export interface UseSchedulerResult {
  /** List of all registered tasks. */
  tasks: IScheduledTask[];
  /** Refresh the task list from the service. */
  refresh: () => void;
  /** Pause a task by name. */
  pause: (name: string) => void;
  /** Resume a paused task by name. */
  resume: (name: string) => void;
  /** Execute a task immediately. */
  runNow: (name: string) => Promise<void>;
}

/**
 * Monitor and control scheduled tasks from a React component.
 *
 * @returns Scheduler state and control functions
 *
 * @example
 * ```typescript
 * function TaskMonitor() {
 *   const { tasks, refresh, pause, resume } = useScheduler();
 *
 *   return (
 *     <ul>
 *       {tasks.map(task => (
 *         <li key={task.name}>
 *           {task.name} — {task.isRunning ? 'Running' : task.isPaused ? 'Paused' : 'Idle'}
 *           <button onClick={() => task.isPaused ? resume(task.name) : pause(task.name)}>
 *             {task.isPaused ? 'Resume' : 'Pause'}
 *           </button>
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useScheduler(): UseSchedulerResult {
  const scheduler = useInject<SchedulerService>(SCHEDULER_SERVICE);
  const [tasks, setTasks] = useState<IScheduledTask[]>(() => scheduler.getRegistered());

  const refresh = useCallback(() => {
    setTasks(scheduler.getRegistered());
  }, [scheduler]);

  const pause = useCallback(
    (name: string) => {
      scheduler.pause(name);
      refresh();
    },
    [scheduler, refresh],
  );

  const resume = useCallback(
    (name: string) => {
      scheduler.resume(name);
      refresh();
    },
    [scheduler, refresh],
  );

  const runNow = useCallback(
    async (name: string) => {
      await scheduler.runNow(name);
      refresh();
    },
    [scheduler, refresh],
  );

  return { tasks, refresh, pause, resume, runNow };
}
