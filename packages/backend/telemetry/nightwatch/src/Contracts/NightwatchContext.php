<?php

declare(strict_types=1);

/**
 * Nightwatch Context Contract.
 *
 * Context providers return a key and data array. The registry wraps
 * each provider's output with `Context::add($key, $data)`.
 *
 * Providers should NOT call Context::add() themselves.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Contracts;

/**
 * Nightwatch Context Contract.
 *
 * Context providers return a key and data array. The service provider
 * wraps each provider's output with `Context::add($key, $data)`.
 *
 * Providers should NOT call Context::add() themselves.
 */
interface NightwatchContext
{
    /**
     * The context key used in `Context::add($key, $data)`.
     */
    public function key(): string;

    /**
     * The context data. Return an associative array.
     *
     * @return array<string, mixed>
     */
    public function data(): array;

    /**
     * Priority for execution order. Higher = runs first.
     */
    public function priority(): int;
}
