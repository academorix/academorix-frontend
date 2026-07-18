/**
 * @file module-already-registered.error.ts
 * @module @stackra/console/errors
 * @description Error thrown when ConsoleModule.forRoot() is called more than once.
 */

import { ConsoleError } from "./console.error";

/**
 * Thrown when `ConsoleModule.forRoot()` is invoked a second time in the
 * same application. The console module is a global singleton — register
 * it exactly once in your root module.
 */
export class ModuleAlreadyRegisteredError extends ConsoleError {
  public constructor() {
    super(
      "ConsoleModule.forRoot() has already been called. The console module can only be " +
        "registered once per application. Remove the duplicate forRoot() call.",
    );
    this.name = "ModuleAlreadyRegisteredError";
  }
}
