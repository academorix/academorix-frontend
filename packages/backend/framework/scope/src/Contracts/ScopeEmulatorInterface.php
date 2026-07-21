<?php

/**
 * @file src/Contracts/ScopeEmulatorInterface.php
 *
 * @description
 * Contract for the emulator that runs a callback under a different
 * (or blank) scope. Used by admin impersonation ("show me what the
 * user sees"), background jobs that need to work in a specific
 * scope, and tests that assert on cross-scope behaviour.
 */

declare(strict_types=1);

namespace Stackra\Scope\Contracts;

use Stackra\Scope\Data\ScopeContextData;
use Stackra\Scope\Exceptions\ScopeContextRequiredException;
use Stackra\Scope\Models\ScopeNode;
use Stackra\Scope\Services\ScopeEmulator;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Scope emulator — layer a temporary context on top of the request
 * context, run a callback, restore the previous state on return.
 *
 * Singleton because it holds no mutable state itself — it delegates
 * to {@see ScopeContextInterface::push()}/`pop()`.
 */
#[Bind(ScopeEmulator::class)]
#[Singleton]
interface ScopeEmulatorInterface
{
    /**
     * Run `$callback` under a scope layered on top of the current
     * context. The original context is restored on return, whether
     * the callback succeeds or throws.
     *
     * @template T
     *
     * @param  ScopeContextData  $context  Override to layer.
     * @param  callable(): T  $callback  Code to run under it.
     * @return T The callback's return.
     */
    public function runIn(ScopeContextData $context, callable $callback): mixed;

    /**
     * Convenience — build the context from a target ScopeNode,
     * inferring owner + scope-slug from the node itself.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function runInNode(ScopeNode $node, callable $callback): mixed;

    /**
     * Run `$callback` with NO active context. Reads will throw
     * {@see ScopeContextRequiredException}
     * unless the callback pushes its own context. Used by seeders
     * and system-level maintenance ops.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function runInBlank(callable $callback): mixed;
}
