<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Repositories;

use Academorix\Compliance\Models\DsarArtefact;
use Academorix\Compliance\Repositories\EloquentDsarArtefactRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see DsarArtefact}.
 *
 * @extends RepositoryInterface<DsarArtefact>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentDsarArtefactRepository::class)]
interface DsarArtefactRepositoryInterface extends RepositoryInterface
{
    /**
     * Every artefact belonging to one DSAR.
     *
     * @return Collection<int, DsarArtefact>
     */
    public function findByDsar(string $dsarId): Collection;
}
