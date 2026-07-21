<?php

/**
 * @file packages/architecture/src/Contracts/Action.php
 *
 * @description
 * Marker interface for single-purpose actions. Equivalent to
 * {@see \Stackra\Architecture\Attributes\Action}.
 *
 * ## Convention (not enforced here)
 *
 * Actions typically expose exactly one public method — one of
 * `__invoke()`, `execute()`, or `handle()`. This interface does
 * NOT enforce that convention because the "one method" rule is
 * team preference; if you want to enforce it, add a phpstan rule
 * (or a follow-up architectural rule) that inspects classes
 * implementing this interface.
 *
 * @see \Stackra\Architecture\Attributes\Action
 */

declare(strict_types=1);

namespace Stackra\Architecture\Contracts;

/**
 * Empty marker interface — no methods to implement.
 */
interface Action
{
}
