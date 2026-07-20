/**
 * @file use-queue.hook.ts
 * @module @stackra/queue/react
 * @description React hook for dispatching jobs to the queue system.
 */

import { useInject } from "@stackra/container/react";
import { QUEUE_MANAGER } from "@stackra/contracts";
import { QueueManager } from "@/core/services/queue-manager.service";

/**
 * Access the QueueManager from a React component.
 *
 * @returns The QueueManager instance
 *
 * @example
 * ```typescript
 * function UploadButton({ file }: Props) {
 *   const queue = useQueue();
 *
 *   const handleUpload = async () => {
 *     const conn = await queue.connection();
 *     await conn.push('process-upload', { fileId: file.id });
 *   };
 *
 *   return <button onClick={handleUpload}>Upload</button>;
 * }
 * ```
 */
export function useQueue(): QueueManager {
  return useInject<QueueManager>(QUEUE_MANAGER);
}
