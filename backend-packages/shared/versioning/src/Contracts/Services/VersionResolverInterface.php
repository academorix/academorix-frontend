<?php

declare(strict_types=1);

namespace Academorix\Versioning\Contracts\Services;

use Illuminate\Http\Request;

/**
 * Contract every version resolver implements.
 *
 * Each resolver reads a single signal from the incoming request
 * (URL prefix, Accept header, query param, ...) and returns the
 * resolved version slug — or `null` when the signal is absent /
 * ambiguous. The resolver chain iterates these in config-declared
 * order; the first non-null answer wins.
 *
 * Resolvers MUST be side-effect-free — they may not mutate the
 * request or emit events. Mutating happens in the middleware.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
interface VersionResolverInterface
{
    /**
     * Attempt to resolve a version slug from the request.
     *
     * @param  Request  $request  Current HTTP request.
     * @return string|null  Version slug (e.g. `v1`) or null when this resolver has no answer.
     */
    public function resolve(Request $request): ?string;
}
