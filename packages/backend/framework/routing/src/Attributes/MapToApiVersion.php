<?php

/**
 * @file packages/routing/src/Attributes/MapToApiVersion.php
 *
 * @description
 * Method-level narrowing for {@see ApiVersion}. Restricts a single
 * controller action to a subset of the versions the CLASS declares.
 *
 * ## Why a separate attribute
 *
 * PHP attributes cannot carry different semantics per-target-kind
 * — a single `#[ApiVersion(['v2'])]` on a method would visually
 * conflict with `#[ApiVersion(['v1', 'v2'])]` on the class, and
 * readers would have to reason about which one "wins". Splitting
 * the two use cases into two attribute names makes intent
 * unambiguous:
 *
 *     #[ApiVersion(['v1', 'v2'])]         // class allowlist
 *     class UsersController { }
 *
 *     #[Get('/users/{id}/preferences')]
 *     #[MapToApiVersion(['v2'])]          // method narrows to v2
 *     public function preferences() { }
 *
 * The middleware treats a method-level `#[MapToApiVersion]` as
 * the FINAL allowlist — it is NOT combined with the class-level
 * `#[ApiVersion]` (which would defeat the narrowing).
 *
 * ## Attribute target
 *
 * `TARGET_METHOD` only. Placing this on a class is a static error
 * — repeat on the class with `#[ApiVersion]` if you want the
 * class-level allowlist.
 *
 * @see ApiVersion       Base allowlist declaration.
 * @see ApiVersionNeutral Alternative when a single action should
 *                        opt out of version negotiation entirely.
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Restrict a controller method to a specific version subset.
 *
 * Repeatable (concatenates lists) but the single-array form
 * `#[MapToApiVersion(['v2'])]` is preferred for readability.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class MapToApiVersion
{
    /**
     * The versions this method serves. Non-empty by contract —
     * an empty list would make the method unreachable.
     *
     * @var list<string>
     */
    public readonly array $versions;

    /**
     * @param  list<string>|string  $versions
     *         Bare version (`'v2'`) or list of versions
     *         (`['v2', 'v3']`). Scalars are lifted to a
     *         single-element list.
     *
     * @throws InvalidArgumentException When the resolved list is
     *                                  empty, or when any entry
     *                                  isn't a non-empty string.
     */
    public function __construct(array|string $versions)
    {
        $list = is_string($versions) ? [$versions] : array_values($versions);

        if ($list === []) {
            throw new InvalidArgumentException(
                '#[MapToApiVersion] requires at least one version.',
            );
        }

        foreach ($list as $entry) {
            if (! is_string($entry) || trim($entry) === '') {
                throw new InvalidArgumentException(
                    '#[MapToApiVersion] entries must be non-empty strings.',
                );
            }
        }

        $this->versions = $list;
    }
}
