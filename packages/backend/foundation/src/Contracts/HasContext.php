<?php

/**
 * @file packages/foundation/src/Contracts/HasContext.php
 *
 * @description
 * Contract for anything that carries a structured context payload —
 * primarily exceptions, but also log-ready value objects. Context is
 * intended for logs / Sentry / debug envelopes; it MUST NOT contain
 * secrets or PII (the exceptions renderer strips sensitive keys before
 * shipping to clients, but `context()` is the raw view for reporters).
 *
 * Keys are snake_case. Values must be JSON-serialisable (scalars,
 * arrays, stringables, backed enums).
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

interface HasContext
{
    /**
     * Structured metadata attached to this instance.
     *
     * @return array<string, mixed>
     */
    public function context(): array;
}
