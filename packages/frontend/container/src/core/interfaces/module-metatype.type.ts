/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file module-metatype.type.ts
 * @module @stackra/container/src/interfaces
 * @description The type of a module definition.
 */

import type { Type, DynamicModule } from "@stackra/contracts";

/**
 * The type of a module definition — can be a class, dynamic module, or promise.
 */
export type ModuleMetatype = Type<any> | DynamicModule | Promise<DynamicModule>;
