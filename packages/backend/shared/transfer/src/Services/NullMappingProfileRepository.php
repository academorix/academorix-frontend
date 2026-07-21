<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Contracts\Data\XferMappingProfileInterface;
use Stackra\Transfer\Contracts\Services\MappingProfileRepositoryInterface;
use Stackra\Transfer\Models\XferMappingProfile;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default implementation of {@see MappingProfileRepositoryInterface}.
 *
 * Provides the header-map lookup + apply logic without hooking into
 * a specific storage strategy. Consumer apps that persist mapping
 * profiles differently (e.g. per-application shared library) override
 * via the interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullMappingProfileRepository implements MappingProfileRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForCaller(string $profileId, string $tenantId, string $callerId): ?XferMappingProfile
    {
        /** @var XferMappingProfile|null $profile */
        $profile = XferMappingProfile::query()
            ->where(XferMappingProfileInterface::ATTR_ID, $profileId)
            ->where(XferMappingProfileInterface::ATTR_TENANT_ID, $tenantId)
            ->where(function ($query) use ($callerId): void {
                $query
                    ->where(XferMappingProfileInterface::ATTR_OWNER_ID, $callerId)
                    ->orWhere(XferMappingProfileInterface::ATTR_IS_SHARED, true);
            })
            ->first();

        return $profile;
    }

    /**
     * {@inheritDoc}
     */
    public function apply(XferMappingProfile $profile, array $sourceHeaders): array
    {
        /** @var array<string, string> $map */
        $map = (array) $profile->{XferMappingProfileInterface::ATTR_HEADER_MAP};

        $rewritten = [];
        foreach ($sourceHeaders as $header) {
            // Header not in the map → pass through untouched. The
            // downstream import validator will decide whether the
            // header is legal for the target entity.
            $rewritten[] = (string) ($map[$header] ?? $header);
        }

        return $rewritten;
    }

    /**
     * {@inheritDoc}
     */
    public function markUsed(XferMappingProfile $profile): void
    {
        $profile->fill([
            XferMappingProfileInterface::ATTR_USED_COUNT   => (int) $profile->{XferMappingProfileInterface::ATTR_USED_COUNT} + 1,
            XferMappingProfileInterface::ATTR_LAST_USED_AT => \now(),
        ])->save();
    }
}
