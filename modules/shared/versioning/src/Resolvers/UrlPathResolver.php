<?php

declare(strict_types=1);

namespace Academorix\Versioning\Resolvers;

use Academorix\Versioning\Contracts\Services\VersionResolverInterface;
use Illuminate\Http\Request;

/**
 * URL-path resolver — extracts the version slug from the first path
 * segment under `versioning.resolvers.url.prefix`.
 *
 * Matches `/api/v1/...` -> `v1`, `/api/v1.2/...` -> `v1.2`,
 * `/api/2024-10-15/...` -> `2024-10-15`. Falls through with `null`
 * for paths outside the configured prefix.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class UrlPathResolver implements VersionResolverInterface
{
    /**
     * Resolve a version slug from the request path.
     */
    public function resolve(Request $request): ?string
    {
        $prefix = (string) \config('versioning.resolvers.url.prefix', '/api');
        $prefix = '/' . \trim($prefix, '/');

        $path = '/' . \ltrim($request->getPathInfo(), '/');
        if ($prefix !== '/' && ! \str_starts_with($path, $prefix . '/')) {
            return null;
        }

        // Trim the prefix and take the leading segment.
        $stripped = \ltrim(\substr($path, \strlen($prefix)), '/');
        if ($stripped === '') {
            return null;
        }

        $segments = \explode('/', $stripped);
        $candidate = $segments[0] ?? '';

        // Accept `v<digit>...` and `YYYY-MM(-DD)?` shapes.
        if (\preg_match('/^v\d+(\.\d+(\.\d+)?)?$/', $candidate) === 1) {
            return $candidate;
        }
        if (\preg_match('/^\d{4}(-\d{2}(-\d{2})?)?$/', $candidate) === 1) {
            return $candidate;
        }

        return null;
    }
}
