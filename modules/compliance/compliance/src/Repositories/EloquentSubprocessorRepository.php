<?php

declare(strict_types=1);

namespace Academorix\Compliance\Repositories;

use Academorix\Compliance\Contracts\Data\SubprocessorInterface;
use Academorix\Compliance\Contracts\Repositories\SubprocessorRepositoryInterface;
use Academorix\Compliance\Models\Subprocessor;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see SubprocessorRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SubprocessorInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    SubprocessorInterface::ATTR_ROLE      => ['$eq', '$in'],
    SubprocessorInterface::ATTR_IS_SYSTEM => ['$eq'],
])]
final class EloquentSubprocessorRepository extends Repository implements SubprocessorRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActive(): Collection
    {
        /** @var Collection<int, Subprocessor> $rows */
        $rows = $this->query()
            ->where(function ($q): void {
                $q->whereNull(SubprocessorInterface::ATTR_ACTIVE_UNTIL)
                    ->orWhere(SubprocessorInterface::ATTR_ACTIVE_UNTIL, '>', \now());
            })
            ->orderBy(SubprocessorInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
