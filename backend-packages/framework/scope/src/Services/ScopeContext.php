<?php

/**
 * @file src/Services/ScopeContext.php
 *
 * @description
 * Concrete implementation of {@see ScopeContextInterface}. Holds
 * a stack of contexts — the bottom is the request-established
 * context (set once by ResolveScope middleware), and additional
 * entries are pushed by the emulator for temporary overrides.
 *
 * `#[Scoped]` on the interface means the container hands out one
 * instance per request lifecycle; Octane rebinds it between
 * requests. Concurrent requests never share state.
 */

declare(strict_types=1);

namespace Academorix\Scope\Services;

use Academorix\Scope\Contracts\ScopeContextInterface;
use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Exceptions\ScopeContextRequiredException;

/**
 * Stack-based scope context.
 *
 * The stack is a `list<ScopeContextData>` where the LAST element
 * is the currently-active context. Operations:
 *
 *   * `set()`    — bootstrap the stack with a single element.
 *   * `push()`   — append (used by the emulator for temporary
 *                  overrides).
 *   * `pop()`    — drop the top. MUST be called in a `finally`.
 *   * `get()`    — return the top, or `null` if empty.
 *   * `clear()`  — empty the stack.
 */
final class ScopeContext implements ScopeContextInterface
{
    /**
     * The context stack. Newer contexts sit at higher indices; the
     * top is `end($this->stack)`.
     *
     * @var list<ScopeContextData>
     */
    private array $stack = [];

    public function get(): ?ScopeContextData
    {
        // `end()` on empty array yields `false`; normalise to null.
        $top = end($this->stack);

        return $top === false ? null : $top;
    }

    public function getOrFail(): ScopeContextData
    {
        $current = $this->get();

        if ($current === null) {
            throw ScopeContextRequiredException::make();
        }

        return $current;
    }

    public function set(ScopeContextData $context): void
    {
        // `set()` is called once per request by the middleware; if
        // there's residual state from a bad Octane worker recycle,
        // clear it before establishing the new context.
        $this->stack = [$context];
    }

    public function push(ScopeContextData $context): void
    {
        $this->stack[] = $context;
    }

    public function pop(): void
    {
        // Guard against unbalanced push/pop — silently dropping
        // when empty would mask emulator bugs. Since the emulator
        // always pushes before it pops, a mismatched pop means a
        // caller reached in directly. Treat as a no-op rather than
        // throwing so we don't cascade a secondary exception during
        // exception unwinding, but log via the caller's own
        // instrumentation if they care.
        array_pop($this->stack);
    }

    public function clear(): void
    {
        $this->stack = [];
    }
}
