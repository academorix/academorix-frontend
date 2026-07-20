<?php

/**
 * @file packages/authorization/src/Attributes/RequirePermission.php
 *
 * @description
 * `#[RequirePermission]` — declarative route-level permission
 * gate. The
 * {@see \Academorix\Authorization\Middleware\AuthorizeControllerAction}
 * middleware inspects the resolved controller class + action
 * method for this attribute and enforces its checks BEFORE the
 * controller body runs.
 *
 * ## Semantics
 *
 *   - **AND across args of one attribute.** `#[RequirePermission(A, B)]`
 *     requires the caller to hold BOTH `A` AND `B`.
 *   - **AND across multiple attributes.** The attribute is
 *     repeatable — stacking `#[RequirePermission(A)] #[RequirePermission(B)]`
 *     also enforces AND. Prefer stacking when the permissions
 *     come from different domains — the split makes intent
 *     easier to grep.
 *   - **OR across args** — use {@see RequireAnyPermission}
 *     instead.
 *
 * ## Placement
 *
 *   - **Class level** — every action on the controller inherits
 *     the check. Use for controllers where every endpoint has the
 *     same permission floor.
 *   - **Method level** — narrows the check to a single action.
 *   - **Both may coexist** — the middleware collects and enforces
 *     the union (compound AND).
 *
 * ## Enum vs string arguments
 *
 * The attribute accepts BOTH backed enums (implementers of
 * {@see \Academorix\Authorization\Contracts\PermissionEnum}) and
 * raw strings. Enum cases are normalised to their `->value` at
 * construction so the middleware sees a uniform `list<string>`.
 *
 * Prefer enum cases — they carry IDE go-to-definition, rename,
 * and PHPStan verification that string literals cannot match.
 *
 * ## Super-admin bypass
 *
 * Permission checks route through Laravel's Gate (via
 * `$user->can()`). The `Gate::before` super-admin hook (wired by
 * `packages/access`'s auth service provider) grants every ability
 * to any user with the `super_admin` role — so super-admins pass
 * every `#[RequirePermission]` gate without needing the specific
 * permission in their catalog.
 *
 * ## Example
 *
 * ```php
 * use Academorix\Authorization\Attributes\RequirePermission;
 * use Academorix\Users\Enums\UserPermission;
 *
 * #[RequirePermission(UserPermission::View)]
 * final class UserController extends CrudController
 * {
 *     #[RequirePermission(UserPermission::Delete)]
 *     public function destroy(int|string $id): JsonResponse
 *     {
 *         return parent::destroy($id);
 *     }
 * }
 * ```
 *
 * `GET /users` requires `user.view`. `DELETE /users/{id}` requires
 * `user.view` AND `user.delete` (compound from class + method).
 *
 * @see \Academorix\Authorization\Middleware\AuthorizeControllerAction Enforcement point.
 * @see RequireAnyPermission                                          OR semantics variant.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Attributes;

use Academorix\Authorization\Contracts\PermissionEnum;
use Attribute;
use BackedEnum;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class RequirePermission
{
    /**
     * Normalised list of permission strings the caller must hold —
     * every one. Enum cases are collapsed to their `->value` at
     * construction so the middleware never has to branch on
     * argument shape.
     *
     * @var list<string>
     */
    public readonly array $permissions;

    /**
     * @param BackedEnum|string ...$permissions Permission names —
     *   backed enum cases (typically implementers of
     *   {@see PermissionEnum}) OR raw strings. At least one is
     *   required; violating that at the call site is a bug the
     *   author's IDE will surface as a "must have >= 1 arg" error
     *   because PHP evaluates variadic args statically.
     */
    public function __construct(BackedEnum|string ...$permissions)
    {
        $this->permissions = array_values(array_map(
            static fn (BackedEnum|string $p): string => $p instanceof BackedEnum
                ? (string) $p->value
                : $p,
            $permissions,
        ));
    }
}
