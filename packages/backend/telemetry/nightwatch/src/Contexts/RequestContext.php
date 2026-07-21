<?php

declare(strict_types=1);

/**
 * Request Context Provider.
 *
 * Adds HTTP request metadata to Nightwatch via
 * `Context::add('request', [...])`.
 *
 * ## Context Added
 * - method, path, request_id
 *
 * ## Octane Safety
 * ✅ Safe — fetches request on each call via `request()` helper.
 *
 * @category Contexts
 *
 * @since    1.0.0
 */

namespace Stackra\Nightwatch\Contexts;

use Stackra\Nightwatch\Attributes\AsNightwatchContext;
use Stackra\Nightwatch\Contracts\NightwatchContext;

/**
 * Provides HTTP request metadata as Nightwatch context.
 *
 * Medium priority (50) — runs after environment context but before
 * lower-priority business-specific providers.
 */
#[AsNightwatchContext(description: 'Adds HTTP request metadata')]
class RequestContext implements NightwatchContext
{
    /**
     * {@inheritDoc}
     */
    public function key(): string
    {
        return 'request';
    }

    /**
     * {@inheritDoc}
     */
    public function data(): array
    {
        $request = request();

        if (! $request) {
            return [];
        }

        return [
            'method' => $request->method(),
            'path' => $request->path(),
            'request_id' => $request->header('X-Request-ID'),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return 50;
    }
}
