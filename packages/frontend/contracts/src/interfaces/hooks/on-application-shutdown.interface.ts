/**
 * Interface defining method to respond to system signals (when application gets
 * shutdown by, e.g., SIGTERM)
 *
 * @see Lifecycle hook contract shared across every `@stackra/*` module
 *
 * @publicApi
 */
export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): any;
}
