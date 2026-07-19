<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Repositories;

use Academorix\Compliance\Models\Subprocessor;
use Academorix\Compliance\Repositories\EloquentSubprocessorRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Subprocessor}.
 *
 * @extends RepositoryInterface<Subprocessor>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentSubprocessorRepository::class)]
interface SubprocessorRepositoryInterface extends RepositoryInterface
{
    /**
     * Every active subprocessor — used by the Trust Center feed.
     *
     * @return Collection<int, Subprocessor>
     */
    public function findActive(): Collection;
}
