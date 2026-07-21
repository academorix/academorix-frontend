<?php

declare(strict_types=1);

namespace Stackra\Versioning\Attributes;

use Attribute;

/**
 * Mark a field on a Data class (Spatie Data / GraphQL type) with its
 * version lifecycle.
 *
 * Renderers strip fields based on the resolved request version — a
 * `#[VersionedField(introducedIn: 'v2')]` field is omitted for a `v1`
 * caller; a `#[VersionedField(deprecatedIn: 'v3', removedIn: 'v4')]`
 * field emits a warning for `v3` callers and is stripped for `v4`.
 *
 * Feature-flag guarded via `versioning.graphql_support` — GraphQL is
 * the primary consumer and the REST envelope only respects this
 * attribute when the flag is on.
 *
 * ```php
 * final class UserData extends Data
 * {
 *     public function __construct(
 *         #[VersionedField(introducedIn: 'v2')]
 *         public ?string $preferredName = null,
 *
 *         #[VersionedField(deprecatedIn: 'v2', removedIn: 'v3')]
 *         public ?string $displayName = null,
 *     ) {}
 * }
 * ```
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
final readonly class VersionedField
{
    /**
     * @param  string       $introducedIn  Version slug the field was added in.
     * @param  string|null  $deprecatedIn  Version slug the field became deprecated in.
     * @param  string|null  $removedIn     Version slug the field is removed / hidden in.
     */
    public function __construct(
        public string $introducedIn,
        public ?string $deprecatedIn = null,
        public ?string $removedIn = null,
    ) {
    }
}
