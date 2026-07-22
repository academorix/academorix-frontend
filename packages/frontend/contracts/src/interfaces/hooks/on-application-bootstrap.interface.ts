/**
 * @file on-application-bootstrap.interface.ts
 * Interface defining method called once the application has fully started and
 * is bootstrapped.
 *
 * @see Lifecycle hook contract shared across every `@stackra/*` module
 *
 * @publicApi
 */
export interface OnApplicationBootstrap {
  onApplicationBootstrap(): any;
}
