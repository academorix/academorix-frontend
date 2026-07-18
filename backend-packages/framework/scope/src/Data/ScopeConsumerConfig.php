<?php

/**
 * @file src/Data/ScopeConsumerConfig.php
 *
 * @description
 * Configuration handed to the registry when a consumer package
 * registers its namespace. Each field is optional — omit them for
 * a bare-bones "any scalar goes" consumer, or provide a strict
 * validator + default factory for typed values.
 */

declare(strict_types=1);

namespace Academorix\Scope\Data;

use Academorix\Scope\Exceptions\ScopeValidationException;

/**
 * Per-consumer configuration.
 *
 * ## Default value factory
 *
 * When a read cascades all the way to the root without finding a
 * value, the resolver invokes `$defaultValueFactory` to synthesise
 * a fallback. The factory receives the key and returns whatever
 * shape the consumer expects. When omitted, the resolver returns
 * `null` on a total miss.
 *
 * ## Validator
 *
 * Every write goes through `$validator` (when set) so bad shapes
 * are rejected at the boundary. Returning `false` (or throwing)
 * causes the write to abort with a
 * {@see ScopeValidationException}.
 */
final readonly class ScopeConsumerConfig
{
    /**
     * @param  (\Closure(string): mixed)|null  $defaultValueFactory
     *                                                               Optional closure that returns the default value for a
     *                                                               given key when the cascade finds nothing.
     * @param  (\Closure(mixed, string): bool)|null  $validator
     *                                                           Optional closure that returns `true` when `$value` is
     *                                                           acceptable for `$key`. Receives `(value, key)`.
     */
    public function __construct(
        public ?\Closure $defaultValueFactory = null,
        public ?\Closure $validator = null,
    ) {}
}
