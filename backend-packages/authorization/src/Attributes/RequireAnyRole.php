<?php

/**
 * @file packages/authorization/src/Attributes/RequireAnyRole.php
 *
 * @description
 * `#[RequireAnyRole]` — OR-semantics variant of
 * {@see RequireRole}. The user must hold AT LEAST ONE of the
 * listed roles.
 *
 * ## Semantics
 *
 *   - **OR across args of one attribute.**
 *     `#[RequireAnyRole('admin', 'coach')]` passes when the user
 *     holds either role.
 *   - **AND across multiple attributes.** Two stacked
 *     `#[RequireAnyRole]` attributes each need to be satisfied
 *     independently.
 *
 * Uses spatie/laravel-permission's `hasAnyRole()` under the hood.
 *
 * @see \Academorix\Authorization\Middleware\AuthorizeControllerAction Enforcement point.
 * @see RequireRole                                                    AND semantics variant.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Attributes;

use Attribute;
use BackedEnum;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class RequireAnyRole
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
