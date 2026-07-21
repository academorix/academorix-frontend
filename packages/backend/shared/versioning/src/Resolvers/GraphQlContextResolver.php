<?php

declare(strict_types=1);

namespace Stackra\Versioning\Resolvers;

use Stackra\Versioning\Contracts\Services\VersionResolverInterface;
use Illuminate\Http\Request;

/**
 * GraphQL context resolver — parses the `@api(version:)` directive
 * off the incoming GraphQL operation.
 *
 * Feature-flag guarded via `versioning.graphql_support`. Falls
 * through with `null` when the flag is off OR when the request is not
 * a GraphQL request (no `query` body field).
 *
 * The full GraphQL parser lives in the GraphQL package downstream —
 * this resolver runs a coarse regex over the operation string to
 * capture the directive without depending on a specific GraphQL
 * implementation. Downstream consumers that need strict parsing can
 * replace the binding via `#[Bind]` on a stricter resolver.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class GraphQlContextResolver implements VersionResolverInterface
{
    /**
     * Resolve a version slug from a GraphQL `@api(version:)` directive.
     */
    public function resolve(Request $request): ?string
    {
        if (! (bool) \config('versioning.graphql_support', false)) {
            return null;
        }

        $query = $request->input('query');
        if (! \is_string($query) || $query === '') {
            return null;
        }

        $directive = (string) \config('versioning.resolvers.graphql.directive_name', 'api');
        $pattern   = '/@' . \preg_quote($directive, '/') . '\s*\(\s*version:\s*"?(?<version>[a-z0-9][a-z0-9._-]{0,30})"?\s*\)/i';

        if (\preg_match($pattern, $query, $matches) === 1) {
            return $matches['version'] ?? null;
        }

        return null;
    }
}
