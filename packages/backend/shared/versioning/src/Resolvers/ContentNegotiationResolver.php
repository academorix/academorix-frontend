<?php

declare(strict_types=1);

namespace Academorix\Versioning\Resolvers;

use Academorix\Versioning\Contracts\Services\VersionResolverInterface;
use Illuminate\Http\Request;

/**
 * Content-negotiation resolver — extracts the version slug from the
 * `Accept` header using the configured MIME pattern (default:
 * `application/vnd.academorix.{version}+json`).
 *
 * Returns `null` when the Accept header is missing, empty, or does
 * not match the pattern.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ContentNegotiationResolver implements VersionResolverInterface
{
    /**
     * Resolve a version slug from the Accept header.
     */
    public function resolve(Request $request): ?string
    {
        $header = (string) $request->header('Accept', '');
        if ($header === '') {
            return null;
        }

        $pattern = (string) \config(
            'versioning.resolvers.header.accept_pattern',
            'application/vnd.academorix.{version}+json',
        );

        // Build a regex from the pattern. `{version}` is the capture.
        $regex = '/^' . \str_replace(
            \preg_quote('{version}', '/'),
            '(?<version>[a-z0-9][a-z0-9._-]{0,30})',
            \preg_quote($pattern, '/'),
        ) . '/i';

        // The Accept header can list multiple types — check each one.
        foreach (\explode(',', $header) as $entry) {
            $trimmed = \trim(\explode(';', $entry)[0]);
            if (\preg_match($regex, $trimmed, $matches) === 1) {
                return $matches['version'] ?? null;
            }
        }

        return null;
    }
}
