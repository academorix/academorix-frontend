<?php

/**
 * @file src/Services/ScopeEmulator.php
 *
 * @description
 * Concrete implementation of {@see ScopeEmulatorInterface}. Wraps
 * a callback in a temporary scope by push/pop-ing the context.
 * The `finally` block guarantees the pop even when the callback
 * throws, so a mis-scoped exception can't leak state to a
 * subsequent request in the same worker.
 */

declare(strict_types=1);

namespace Academorix\Scope\Services;

use Academorix\Scope\Contracts\ScopeContextInterface;
use Academorix\Scope\Contracts\ScopeEmulatorInterface;
use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Exceptions\ScopeContextRequiredException;
use Academorix\Scope\Models\ScopeNode;

/**
 * Scope emulator — three convenience wrappers around the context
 * stack.
 *
 * ## Blank scope
 *
 * `runInBlank()` clears the stack for the callback's duration and
 * restores it afterwards. Distinct from "no context" because a
 * subsequent restore is expected — for the duration, the read
 * side throws {@see ScopeContextRequiredException}
 * so any bugs surface immediately.
 */
final class ScopeEmulator implements ScopeEmulatorInterface
{
    public function __construct(
        private readonly ScopeContextInterface $context,
    ) {}

    public function runIn(ScopeContextData $context, callable $callback): mixed
    {
        $this->context->push($context);

        try {
            return $callback();
        } finally {
            // `finally` fires on both the success and exception
            // paths — the pop always happens.
            $this->context->pop();
        }
    }

    public function runInNode(ScopeNode $node, callable $callback): mixed
    {
        return $this->runIn(ScopeContextData::fromNode($node), $callback);
    }

    public function runInBlank(callable $callback): mixed
    {
        // Preserve the current stack in memory so we can restore
        // it after the callback. `clear()` empties the stack; on
        // return, we re-establish exactly what was there.
        $snapshot = $this->context->get();

        $this->context->clear();

        try {
            return $callback();
        } finally {
            if ($snapshot !== null) {
                $this->context->set($snapshot);
            }
        }
    }
}
