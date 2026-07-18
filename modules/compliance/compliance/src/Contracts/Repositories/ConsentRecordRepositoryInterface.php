<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Repositories;

use Academorix\Compliance\Models\ConsentRecord;
use Academorix\Compliance\Repositories\EloquentConsentRecordRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see ConsentRecord}.
 *
 * @extends RepositoryInterface<ConsentRecord>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentConsentRecordRepository::class)]
interface ConsentRecordRepositoryInterface extends RepositoryInterface
{
    /**
     * Latest consent decision for one (subject, category) tuple.
     * `null` when the subject has never expressed a decision.
     */
    public function findLatestFor(string $subjectType, string $subjectId, string $categoryKey): ?ConsentRecord;

    /**
     * Every consent record for one subject, newest first.
     *
     * @return Collection<int, ConsentRecord>
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection;
}
