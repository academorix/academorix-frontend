<?php

/**
 * @file packages/foundation/src/Contracts/HasUserMessage.php
 *
 * @description
 * Contract for exceptions and results that carry a *safe-to-display*
 * message. The standard `\Throwable::getMessage()` is for developers
 * and logs — it may leak internals ("SQLSTATE[23000]: ..."). This
 * message is the one an API can hand to a client-facing UI without
 * scrubbing.
 *
 * `userMessage()` returns `null` when the throwable has no safe
 * counterpart; renderers should fall back to a generic "something
 * went wrong" in that case.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

interface HasUserMessage
{
    /**
     * Translated, safe-to-display message intended for end users.
     */
    public function userMessage(): ?string;
}
