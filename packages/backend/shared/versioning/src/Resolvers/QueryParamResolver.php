<?php

declare(strict_types=1);

namespace Stackra\Versioning\Resolvers;

use Stackra\Versioning\Contracts\Services\VersionResolverInterface;
use Illuminate\Http\Request;

/**
 * Query-param resolver — reads the version slug from a query string
 * parameter (default: `?version=v1`).
 *
 * Disabled in production by default per `versioning.resolvers.query`.
 * Meant primarily for public docs + integration testing surfaces.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class QueryParamResolver implements VersionResolverInterface
{
    /**
     * Resolve a version slug from the configured query parameter.
     */
    public function resolve(Request $request): ?string
    {
        if (! $this->isEnabled()) {
            return null;
        }

        $param = (string) \config('versioning.resolvers.query.param_name', 'version');
        $value = $request->query($param);

        if (! \is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    /**
     * The query resolver is disabled unless the current env appears
     * in `versioning.resolvers.query.enabled_environments` OR
     * `versioning.resolvers.query.enabled` is on.
     */
    private function isEnabled(): bool
    {
        if ((bool) \config('versioning.resolvers.query.enabled', false)) {
            return true;
        }

        $allowed = (array) \config(
            'versioning.resolvers.query.enabled_environments',
            ['local', 'testing', 'staging'],
        );

        $current = (string) \config('app.env', 'production');

        return \in_array($current, $allowed, true);
    }
}
