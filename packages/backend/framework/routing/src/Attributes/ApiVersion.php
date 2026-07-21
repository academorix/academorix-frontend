<?php

/**
 * @file packages/routing/src/Attributes/ApiVersion.php
 *
 * @description
 * Declarative metadata: which API versions a controller or method
 * supports. Read by
 * {@see \Stackra\Routing\Middleware\DetectApiVersion} during the
 * request pipeline to decide whether the resolved request version
 * is acceptable for the target route.
 *
 * ## Semantics
 *
 *   - Placed on a CLASS: every route on the controller inherits
 *     the version allowlist.
 *   - Placed on a METHOD: NARROWS the class-level allowlist to
 *     just this action. The method allowlist MUST be a non-empty
 *     subset of the class allowlist (validation lives in the
 *     middleware; the attribute itself only carries data).
 *   - Repeatable — `#[ApiVersion(['v1'])] #[ApiVersion(['v2'])]`
 *     is legal syntactic sugar and merges to
 *     `['v1', 'v2']`. Prefer the single-array form for readability.
 *
 * ## Absence
 *
 *   - No `#[ApiVersion]` and no {@see ApiVersionNeutral} on the
 *     class → the endpoint falls back to the DEFAULT version
 *     configured in `config/api-versioning.php`. This keeps
 *     unversioned legacy controllers working.
 *
 * ## Interaction with path-based versioning
 *
 * Path prefixes (`/api/v1/...` via {@see Prefix}) already carry
 * a de-facto version. This attribute is ADDITIVE metadata used for
 *
 *   1. Deprecation header emission (`X-API-Deprecated`).
 *   2. Sunset header emission (see {@see Sunsets}).
 *   3. OpenAPI generation — the swagger scanner reads this to
 *      tag operations by API version.
 *   4. Runtime negotiation via `Accept: application/vnd.api+json; version=v2`.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Routing\Attributes\ApiVersion;
 * use Stackra\Routing\Attributes\Get;
 *
 * // Whole controller pinned to v1.
 * #[ApiVersion(['v1'])]
 * class InvoicesV1Controller extends BaseController
 * {
 *     #[Get('/invoices')]
 *     public function index() { }
 * }
 *
 * // Multi-version controller.
 * #[ApiVersion(['v1', 'v2'])]
 * class UsersController extends BaseController
 * {
 *     // Inherits both v1 and v2.
 *     #[Get('/users')]
 *     public function index() { }
 *
 *     // Method-level narrowing — only served on v2+.
 *     #[Get('/users/{id}/preferences')]
 *     #[MapToApiVersion(['v2'])]
 *     public function preferences() { }
 * }
 * ```
 *
 * @see MapToApiVersion   Method-level narrowing.
 * @see ApiVersionNeutral Version-agnostic endpoints.
 * @see Sunsets           Deprecation metadata.
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Declare the API versions a controller class or method supports.
 *
 * The attribute stores its versions verbatim (as passed by the
 * user) so the DetectApiVersion middleware can echo the requested
 * label back in headers. Normalisation for comparison happens in
 * {@see \Stackra\Routing\Services\VersionComparator}.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final class ApiVersion
{
    /**
     * Versions supported at this level. Non-empty by contract; the
     * constructor enforces it because a version-neutral endpoint
     * should use {@see ApiVersionNeutral} rather than an empty
     * `#[ApiVersion([])]` sentinel.
     *
     * @var list<string>
     */
    public readonly array $versions;

    /**
     * @param  list<string>|string  $versions
     *         Either a bare version string (`'v1'`) or a list of
     *         them (`['v1', 'v2']`). Scalars are wrapped so both
     *         call shapes work with the same attribute.
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
                '#[ApiVersion] requires at least one version. Use #[ApiVersionNeutral] for version-agnostic endpoints.',
            );
        }

        foreach ($list as $entry) {
            if (! is_string($entry) || trim($entry) === '') {
                throw new InvalidArgumentException(
                    '#[ApiVersion] entries must be non-empty strings.',
                );
            }
        }

        $this->versions = $list;
    }
}
