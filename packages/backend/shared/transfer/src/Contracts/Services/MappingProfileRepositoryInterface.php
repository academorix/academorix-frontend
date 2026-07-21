<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Services;

use Stackra\Transfer\Models\XferMappingProfile;
use Stackra\Transfer\Services\NullMappingProfileRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * High-level accessor for {@see XferMappingProfile} rows.
 *
 * Distinct from
 * {@see \Stackra\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface}
 * — this contract wraps mapping-profile lookups with the domain
 * semantics the import pipeline needs (resolve-for-entity, apply-to-
 * headers, mark-used). Consumers override the two together when
 * swapping the storage layer.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(NullMappingProfileRepository::class)]
interface MappingProfileRepositoryInterface
{
    /**
     * Resolve a mapping profile by id + tenant, returning null when
     * not visible.
     */
    public function findForCaller(string $profileId, string $tenantId, string $callerId): ?XferMappingProfile;

    /**
     * Apply a mapping profile's `header_map` to a raw list of source
     * headers, returning the rewritten list.
     *
     * @param  list<string>  $sourceHeaders
     * @return list<string>
     */
    public function apply(XferMappingProfile $profile, array $sourceHeaders): array;

    /**
     * Bump `used_count` + `last_used_at` on a profile.
     */
    public function markUsed(XferMappingProfile $profile): void;
}
