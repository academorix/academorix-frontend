<?php

/**
 * @file src/Contracts/ScopeContextInterface.php
 *
 * @description
 * Contract for the request-scoped "who am I resolving for?" holder.
 * The context implementation stores the current node as a scoped
 * container binding (Octane-safe — one instance per request), with
 * an override stack for the emulator so `Scope::runIn($other, fn)`
 * can layer temporary contexts.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts;

use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Exceptions\ScopeContextRequiredException;
use Academorix\Scope\Middleware\ResolveScope;
use Academorix\Scope\Services\ScopeContext;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Request-scoped scope context.
 *
 * The `#[Bind]` attribute wires this interface to
 * {@see ScopeContext} in the container.
 * `#[Scoped]` gives one instance per request (Octane resets it
 * between requests, standard FPM starts fresh per script) so
 * concurrent requests never leak scope state.
 *
 * The context supports a small override stack used by
 * {@see ScopeEmulatorInterface::runIn()}. Pushing an override does
 * not persist — `pop()` MUST be called (typically in a `finally`
 * block) to restore the previous top.
 */
#[Bind(ScopeContext::class)]
#[Scoped]
interface ScopeContextInterface
{
    /**
     * Read the currently-active context.
     *
     * @return ScopeContextData|null The active context, or `null`
     *                               when no resolver has run yet.
     */
    public function get(): ?ScopeContextData;

    /**
     * Read the currently-active context, or throw if unset.
     *
     * Used by paths that MUST have context (Eloquent auto-scope,
     * cache-tag derivation). Fails loud instead of silently
     * returning a stale/empty result.
     *
     * @return ScopeContextData The active context.
     *
     * @throws ScopeContextRequiredException When no context is set.
     */
    public function getOrFail(): ScopeContextData;

    /**
     * Establish the initial context for the request.
     *
     * Called exactly once per request by
     * {@see ResolveScope} after the
     * resolver chain returns a non-null result. Subsequent writes
     * during the same request should go through `push()` / `pop()`
     * so the initial context stays recoverable.
     *
     * @param  ScopeContextData  $context  The context to set.
     */
    public function set(ScopeContextData $context): void;

    /**
     * Layer a temporary context on top of the current one.
     *
     * Used by {@see ScopeEmulatorInterface::runIn()}. The previous
     * top is preserved and restored by the next `pop()`.
     *
     * @param  ScopeContextData  $context  Temporary context.
     */
    public function push(ScopeContextData $context): void;

    /**
     * Restore the previous context after a `push()`.
     *
     * MUST be called in a `finally` block so pushed contexts are
     * cleaned up even on exception.
     */
    public function pop(): void;

    /**
     * Clear the entire context stack.
     *
     * Called by the emulator's `runInBlank()` and by test setup so
     * subsequent reads throw {@see ScopeContextRequiredException}.
     */
    public function clear(): void;
}
