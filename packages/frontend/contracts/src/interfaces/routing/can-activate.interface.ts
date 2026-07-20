/**
 * @file can-activate.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Runtime contract implemented by every guard class.
 */

import type { IGuardContext } from "./guard-context.interface";
import type { IGuardDecision } from "./guard-decision.type";

/**
 * Contract implemented by a `@Guard`-decorated class.
 *
 * @example
 * ```typescript
 * @Guard({name: 'auth', priority: 1000})
 * export class AuthGuard implements ICanActivate {
 *   public async canActivate(ctx: IGuardContext): Promise<boolean | IGuardDecision> {
 *     const user = await this.auth.userFromRequest(ctx.request);
 *     if (!user) return {redirect: '/sign-in'};
 *     ctx.state.user = user;
 *     return true;
 *   }
 * }
 * ```
 */
export interface ICanActivate {
  /**
   * Decide whether the guarded route should render.
   *
   * @param context - Runtime guard context.
   * @returns `true` / `false` for allow / deny with no extras, or an
   *   {@link IGuardDecision} for redirect / notFound / abort semantics.
   */
  canActivate(context: IGuardContext): boolean | IGuardDecision | Promise<boolean | IGuardDecision>;
}
