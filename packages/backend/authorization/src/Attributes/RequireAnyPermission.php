<?php

/**
 * @file packages/authorization/src/Attributes/RequireAnyPermission.php
 *
 * @description
 * `#[RequireAnyPermission]` — OR-semantics variant of
 * {@see RequirePermission}. The caller must hold AT LEAST ONE of
 * the listed permissions.
 *
 * ## Semantics
 *
 *   - **OR across args of one attribute.** `#[RequireAnyPermission(A, B)]`
 *     passes when the user has A OR B (or both).
 *   - **AND across multiple attributes.** Stacking two
 *     `#[RequireAnyPermission]` attributes means every attribute's
 *     OR-set must be satisfied independently — each attribute is
 *     one required condition.
 *
 * ## When to use
 *
 * Use OR-semantics when a route is valid for multiple roles that
 * happen to grant different-named permissions:
 *
 * ```php
 * #[RequireAnyPermission(
 *     TeamPermission::ManageOwn,       // coach on their own team
 *     TeamPermission::ManageAny,       // admin managing any team
 * )]
 * public function update(int|string $id): JsonResponse { … }
 * ```
 *
 * When you need "user must have ALL of these" instead, use
 * {@see RequirePermission}.
 *
 * ## Placement
 *
 * Same as `RequirePermission`: class level applies to every
 * action, method level narrows to a single action, both may
 * coexist and combine with AND across attribute instances.
 *
 * @see \Stackra\Authorization\Middleware\AuthorizeControllerAction Enforcement point.
 * @see RequirePermission                                              AND semantics variant.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Attributes;

use Attribute;
use BackedEnum;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class RequireAnyPermission
{
    /**
     * @var list<string>
     */
    public readonly array $permissions;

    /**
     * @param BackedEnum|string ...$permissions Permission names —
     *   backed enum cases (typically implementers of
     *   {@see \Stackra\Authorization\Contracts\PermissionEnum})
     *   OR raw strings.
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
