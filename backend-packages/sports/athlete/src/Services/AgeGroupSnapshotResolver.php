<?php

declare(strict_types=1);

namespace Academorix\Athlete\Services;

use Academorix\AgeGroup\Contracts\Data\AgeGroupInterface;
use Academorix\Athlete\Contracts\Services\AgeGroupSnapshotResolverInterface;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * Materialised age-group snapshot resolver.
 *
 * Walks the tenant's `age_groups` catalogue and returns the row whose
 * `[min_age_inclusive, max_age_inclusive]` window covers the derived
 * age. Ties break on `sort_order` ASC — the tenant admin controls
 * the resolution order when overlapping buckets exist.
 *
 * ## Why not compute on read?
 *
 * Every enrollment form + roster filter queries `athletes` by
 * `current_age_group_id`. Computing the group on read would either
 * force a DOB-index scan or a per-request join. Snapshotting keeps
 * the read hot path fast; the season-boundary rollover job keeps
 * the snapshot in sync.
 *
 * `#[Scoped]` — reads the tenant scope through the query.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class AgeGroupSnapshotResolver implements AgeGroupSnapshotResolverInterface
{
    /**
     * {@inheritDoc}
     */
    public function resolveForDateOfBirth(string $tenantId, string $dateOfBirth): ?string
    {
        try {
            $dob = new \DateTimeImmutable($dateOfBirth);
        } catch (\Throwable) {
            // Malformed date — the provisioner's DOB-bounds check should have
            // already caught this. Fail-soft here so the snapshot resolution
            // never blocks the create.
            return null;
        }

        $age = (int) $dob->diff(new \DateTimeImmutable())->y;

        return $this->resolveForAge($tenantId, $age);
    }

    /**
     * {@inheritDoc}
     */
    public function resolveForAge(string $tenantId, int $ageYears): ?string
    {
        /** @var array<int, object{id: string}> $rows */
        $rows = DB::table(AgeGroupInterface::TABLE)
            ->select(AgeGroupInterface::ATTR_ID)
            ->where(AgeGroupInterface::ATTR_TENANT_ID, $tenantId)
            ->whereNull(AgeGroupInterface::ATTR_DELETED_AT)
            ->where(AgeGroupInterface::ATTR_MIN_AGE_INCLUSIVE, '<=', $ageYears)
            ->where(AgeGroupInterface::ATTR_MAX_AGE_INCLUSIVE, '>=', $ageYears)
            ->orderBy(AgeGroupInterface::ATTR_SORT_ORDER)
            ->limit(1)
            ->get()
            ->all();

        return $rows === [] ? null : (string) $rows[0]->{AgeGroupInterface::ATTR_ID};
    }
}
