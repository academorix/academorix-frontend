<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Services;

use Academorix\Compliance\Models\Dsar;
use Academorix\Compliance\Services\DefaultDsarOrchestrator;
use Illuminate\Container\Attributes\Bind;

/**
 * State machine controller for a DSAR.
 *
 * Drives the transitions received → triaging → collecting →
 * assembling → delivered (or rejected at any step). Fires the
 * matching event per transition.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultDsarOrchestrator::class)]
interface DsarOrchestratorInterface
{
    /**
     * Move the DSAR to `triaging` (from `received`).
     */
    public function triage(Dsar $dsar): Dsar;

    /**
     * Move the DSAR to `collecting` — fan out the per-module
     * collection jobs.
     */
    public function startCollection(Dsar $dsar): Dsar;

    /**
     * Move the DSAR to `assembling` — kick off the bundle assembly.
     */
    public function assemble(Dsar $dsar): Dsar;

    /**
     * Move the DSAR to `delivered` — mint a signed URL + notify the
     * subject.
     */
    public function deliver(Dsar $dsar, string $downloadSignature, \DateTimeInterface $expiresAt): Dsar;

    /**
     * Reject the DSAR (any prior state → `rejected`).
     */
    public function reject(Dsar $dsar, string $reason): Dsar;
}
