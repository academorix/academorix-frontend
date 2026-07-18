/**
 * Interface defining method called just before Nest destroys the host module
 * (`app.close()` method has been evaluated).  Use to perform cleanup on
 * resources (e.g., Database connections).
 *
 * @see Lifecycle hook contract shared across every `@stackra/*` module
 *
 * @publicApi
 */
export interface OnModuleDestroy {
  onModuleDestroy(): any;
}
