<?php

declare(strict_types=1);

namespace Stackra\Domains\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Domains\Models\DomainRecord;
use Stackra\Domains\Repositories\EloquentDomainRecordRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see DomainRecord}.
 *
 * @extends RepositoryInterface<DomainRecord>
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Bind(EloquentDomainRecordRepository::class)]
interface DomainRecordRepositoryInterface extends RepositoryInterface
{
    /**
     * Every expected DNS record for a domain.
     *
     * @return Collection<int, DomainRecord>
     */
    public function findByDomain(string $domainId): Collection;

    /**
     * Whether every record for a domain reports `status = matches`.
     * Called by the verification job to decide when to flip the
     * parent Domain's `verified_at`.
     */
    public function allMatchingForDomain(string $domainId): bool;
}
