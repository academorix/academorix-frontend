<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Localization\Models\TranslationJob;
use Academorix\Localization\Repositories\EloquentTranslationJobRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see TranslationJob}.
 *
 * @extends RepositoryInterface<TranslationJob>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(EloquentTranslationJobRepository::class)]
interface TranslationJobRepositoryInterface extends RepositoryInterface
{
    /**
     * In-flight jobs (queued or running) for a tenant.
     *
     * @param  string  $tenantId  Tenant to scope by.
     * @return Collection<int, TranslationJob>
     */
    public function findActiveForTenant(string $tenantId): Collection;

    /**
     * Increment the `translated_keys` counter atomically.
     *
     * @param  string  $jobId  Job id to increment.
     */
    public function incrementTranslatedKeys(string $jobId): void;

    /**
     * Increment the `failed_keys` counter atomically.
     *
     * @param  string  $jobId  Job id to increment.
     */
    public function incrementFailedKeys(string $jobId): void;
}
