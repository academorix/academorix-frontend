<?php

/**
 * @file packages/foundation/src/Contracts/HasErrorCode.php
 *
 * @description
 * Contract for anything that exposes a stable, machine-readable error
 * code. Exceptions in `stackra/exceptions`, API error payloads, and
 * domain result objects all implement this so clients can branch on
 * `error.code` without pattern-matching on human messages.
 *
 * Codes are lowercase dotted strings, scoped by domain:
 *
 *   billing.invoice.overdue
 *   auth.token.expired
 *   ai.provider.quota_exceeded
 *
 * The prefix matches the package name that owns the code. See
 * {@see \Stackra\Exceptions\Exception::$errorCode} for the
 * base implementation.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

interface HasErrorCode
{
    /**
     * The stable, machine-readable error code (e.g. `billing.invoice.overdue`).
     *
     * Codes MUST be stable across releases — treat them as a public
     * API. Rename only through a deprecation window.
     */
    public function errorCode(): string;
}
