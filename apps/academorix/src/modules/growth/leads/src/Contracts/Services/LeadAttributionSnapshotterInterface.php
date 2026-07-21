<?php

declare(strict_types=1);

namespace Stackra\Leads\Contracts\Services;

use Stackra\Leads\Services\LeadAttributionSnapshotter;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Service contract — freeze the attribution context at lead-capture
 * time into the immutable `attribution_snapshot` JSON on the row.
 *
 * The snapshot is the caller's UTM + referrer + click-id envelope,
 * hashed IP, and device parse — everything the growth::attribution
 * module hands us via its resolver. Once persisted, the snapshot is
 * NEVER modified — attribution reports read it verbatim years later
 * for regulator lookback.
 *
 * Bound to the concrete via `#[Bind(LeadAttributionSnapshotter::class)]`.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Bind(LeadAttributionSnapshotter::class)]
#[Scoped]
interface LeadAttributionSnapshotterInterface
{
    /**
     * Build the snapshot payload from the active attribution context.
     *
     * Return `null` when no attribution context is present (server-to-
     * server intake, seeder). Callers persist the return value on
     * `leads.attribution_snapshot`; a null return keeps the column
     * NULL.
     *
     * @return array<string, mixed>|null  Frozen snapshot, or `null` when there is no context.
     */
    public function currentSnapshot(): ?array;
}
