<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Storage\Models\ChunkedUpload;
use Academorix\Storage\Repositories\EloquentChunkedUploadRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see ChunkedUpload}.
 *
 * @extends RepositoryInterface<ChunkedUpload>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(EloquentChunkedUploadRepository::class)]
interface ChunkedUploadRepositoryInterface extends RepositoryInterface
{
    /**
     * Every row past its `expires_at` deadline — consumed by
     * {@see \Academorix\Storage\Jobs\PurgeAbortedChunkedUploadsJob}.
     *
     * @return Collection<int, ChunkedUpload>
     */
    public function findExpired(\DateTimeInterface $now): Collection;

    /**
     * In-flight uploads for a tenant (`initiating` / `uploading` /
     * `finalizing`) — powers "resume upload" screens.
     *
     * @return Collection<int, ChunkedUpload>
     */
    public function findInflight(string $tenantId): Collection;
}
