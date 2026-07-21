<?php

declare(strict_types=1);

namespace Stackra\Audit\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the tamper-evident chain verifier detects a mismatch
 * between the stored `chain_hash` and the recomputed value.
 *
 * This is a P0 compliance signal — the exception path is triggered
 * ONLY by code paths that need a synchronous refusal (e.g., a
 * platform-admin surface that must not present potentially-tampered
 * data as if it were canonical). The async signal is
 * {@see \Stackra\Audit\Events\AuditChainBroken}, dispatched by the
 * verifier regardless of the code path.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditChainBrokenException extends StackraException
{
    public const CODE = 'audit.chain_broken';

    public const TRANSLATION_KEY = 'audit::errors.chain_broken';
}
