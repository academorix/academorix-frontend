/**
 * @file scope-options.interface.ts
 * @module @stackra/contracts/interfaces
 * @description Options accepted by `@Injectable()` to configure a provider's
 *   lifecycle scope.
 */

import type { Scope } from "@/enums/scope.enum";

/**
 * @publicApi
 *
 * @see Injection scope contract used by `@Injectable({ scope })`
 */
export interface ScopeOptions {
  /**
   * Specifies the lifetime of an injected Provider or Controller.
   */
  scope?: Scope;
  /**
   * Flags provider as durable. This flag can be used in combination with a
   * custom context id factory strategy to construct lazy DI subtrees.
   *
   * Only meaningful in conjunction with `scope = Scope.REQUEST`.
   */
  durable?: boolean;
}
