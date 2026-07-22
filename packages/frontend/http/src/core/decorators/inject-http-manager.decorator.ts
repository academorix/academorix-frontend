/**
 * @file inject-http-manager.decorator.ts
 * `@InjectHttpManager()` parameter decorator.
 *
 * Convenience wrapper over `@Inject(HTTP_MANAGER)`. Use when a
 * service needs the manager itself — for runtime connection
 * switching, registering custom drivers programmatically, or
 * introspecting the registry.
 *
 * @module @stackra/http/decorators/inject-http-manager
 */

import { Inject } from "@stackra/container";
import { HTTP_MANAGER } from "@stackra/contracts";

/**
 * Inject the `IHttpManager`.
 *
 * @returns Parameter / property decorator.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class HttpAdminService {
 *   public constructor(@InjectHttpManager() private readonly manager: IHttpManager) {}
 *
 *   public listConnections(): string[] {
 *     return this.manager.getConnectionNames();
 *   }
 * }
 * ```
 */
export function InjectHttpManager(): ParameterDecorator & PropertyDecorator {
  return Inject(HTTP_MANAGER);
}
