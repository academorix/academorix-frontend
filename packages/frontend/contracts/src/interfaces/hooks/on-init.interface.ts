/**
 * @file on-init.interface.ts
 * Interface defining method called once the host module has been initialized.
 *
 * @see Lifecycle hook contract shared across every `@stackra/*` module
 *
 * @publicApi
 */
export interface OnModuleInit {
  onModuleInit(): any;
}
