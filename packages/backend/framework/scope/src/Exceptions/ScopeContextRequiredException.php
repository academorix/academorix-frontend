<?php

/**
 * @file src/Exceptions/ScopeContextRequiredException.php
 *
 * @description
 * Thrown when a code path that MUST have a scope context reads
 * `ScopeContext::getOrFail()` outside a middleware-wrapped request.
 * Usually indicates the route is missing the `scope` middleware or
 * a background job forgot to run under `ScopeEmulator::runIn()`.
 */

declare(strict_types=1);

namespace Stackra\Scope\Exceptions;

/**
 * No active scope context — fail closed.
 *
 * Common causes:
 *
 *   1. Route not wrapped in the `scope` middleware group.
 *   2. Console command doing real work outside
 *      `ScopeEmulator::runIn()`.
 *   3. Queued job dispatched without capturing + rehydrating the
 *      dispatch-time context.
 */
final class ScopeContextRequiredException extends ScopeException
{
    public static function make(): self
    {
        return new self(
            'No active scope context. Ensure the request goes '
            .'through the `scope` middleware, or wrap the block in '
            .'`ScopeEmulator::runIn(...)`.',
        );
    }
}
