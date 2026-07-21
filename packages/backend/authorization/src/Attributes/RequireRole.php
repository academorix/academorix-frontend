<?php

/**
 * @file packages/authorization/src/Attributes/RequireRole.php
 *
 * @description
 * `#[RequireRole]` — declarative route-level ROLE gate. The
 * {@see \Stackra\Authorization\Middleware\AuthorizeControllerAction}
 * middleware inspects the resolved controller class + action
 * method for this attribute and enforces its checks BEFORE the
 * controller body runs.
 *
 * ## Semantics
 *
 *   - **AND across args of one attribute.** `#[RequireRole('admin', 'auditor')]`
 *     requires the user to hold BOTH roles.
 *   - **AND across multiple attributes.** The attribute is
 *     repeatable — stacking two `#[RequireRole]` attributes also
 *     enforces AND.
 *   - **OR across args** — use {@see RequireAnyRole}.
 *
 * ## Roles vs. permissions
 *
 * Roles are coarser-grained than permissions. Prefer permissions
 * (`user.delete`) when possible — they're finer-grained and
 * easier to reassign between roles without touching controller
 * code. Reach for roles when the semantics genuinely are
 * role-based (e.g. "any staff member can view the internal
 * dashboard, regardless of specific permissions").
 *
 * ## No super-admin bypass
 *
 * Role checks are ground truth — they do NOT flow through
 * Laravel's Gate. A `super_admin` user who lacks the requested
 * role is denied. This is deliberate: `super_admin` grants every
 * ability but does not automatically grant every role.
 *
 * ## Backend dependency
 *
 * The middleware calls `$user->hasAllRoles(...)` — a method
 * provided by spatie/laravel-permission's `HasRoles` trait.
 * Applications that ship an alternative role backend can bind
 * their own user model as long as it implements the same method
 * signature.
 *
 * @see \Stackra\Authorization\Middleware\AuthorizeControllerAction Enforcement point.
 * @see RequireAnyRole                                                 OR semantics variant.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Attributes;

use Attribute;
use BackedEnum;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class RequireRole
{
    /**
     * @var list<string>
     */
    public readonly array $roles;

    /**
     * @param BackedEnum|string ...$roles Role names — backed enum
     *   cases OR raw strings.
     */
    public function __construct(BackedEnum|string ...$roles)
    {
        $this->roles = array_values(array_map(
            static fn (BackedEnum|string $r): string => $r instanceof BackedEnum
                ? (string) $r->value
                : $r,
            $roles,
        ));
    }
}
