import { Type } from "@/interfaces/type.interface";
import type { ModuleMetadata } from "./module-metadata.interface";

/**
 * Interface defining a Dynamic Module.
 *
 * @see Dynamic module contract used by `Module.forRoot()` / `Module.forRootAsync()`
 *
 * @publicApi
 */
export interface DynamicModule extends ModuleMetadata {
  /**
   * A module reference
   */
  module: Type<any>;

  /**
   * When "true", makes a module global-scoped.
   *
   * Once imported into any module, a global-scoped module will be visible
   * in all modules. Thereafter, modules that wish to inject a service exported
   * from a global module do not need to import the provider module.
   *
   * @default false
   */
  global?: boolean;
}
