<?php

declare(strict_types=1);

namespace Academorix\Chargeback\Contracts\Services;

use Academorix\Chargeback\Services\ChargebackNumberGenerator;
use Illuminate\Container\Attributes\Bind;

/**
 * Human-readable chargeback identifier generator.
 *
 * Chargebacks receive TWO identifiers: the internal ULID (used for
 * primary keys + cross-service references) and a human-readable
 * "chargeback number" (CB-2026-000123) that finance staff quote to
 * acquirers, cardholders, and customer-support callers.
 *
 * Format: CB-YYYY-NNNNNN — six-digit zero-padded sequential counter,
 * reset per (tenant, calendar year).
 *
 * Concrete: {@see ChargebackNumberGenerator}.
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[Bind(ChargebackNumberGenerator::class)]
interface ChargebackNumberGeneratorInterface
{
    /**
     * Return the next human-readable chargeback number for the given tenant.
     *
     * @param  string             $tenantId  Owning tenant.
     * @param  \DateTimeImmutable $filedAt   Filing timestamp — year drives the counter partition.
     */
    public function next(string $tenantId, \DateTimeImmutable $filedAt): string;
}
