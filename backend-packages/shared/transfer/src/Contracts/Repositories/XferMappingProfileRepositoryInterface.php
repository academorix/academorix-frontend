<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Transfer\Models\XferMappingProfile;
use Academorix\Transfer\Repositories\EloquentXferMappingProfileRepository;
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
