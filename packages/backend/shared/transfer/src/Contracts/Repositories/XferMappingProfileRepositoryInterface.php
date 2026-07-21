<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Transfer\Models\XferMappingProfile;
use Stackra\Transfer\Repositories\EloquentXferMappingProfileRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see XferMappingProfile}.
 *
 * @extends RepositoryInterface<XferMappingProfile>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(EloquentXferMappingProfileRepository::class)]
interface XferMappingProfileRepositoryInterface extends RepositoryInterface
{
    /**
     * Profiles owned by a specific user.
     *
     * @return Collection<int, XferMappingProfile>
     */
    public function findByOwner(string $ownerId): Collection;

    /**
     * Profiles visible to a user inside a tenant — own + tenant-shared.
     *
     * @return Collection<int, XferMappingProfile>
     */
    public function findVisibleTo(string $tenantId, string $ownerId): Collection;
}
