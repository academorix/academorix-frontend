<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Storage\Models\ChunkedUpload;
use Stackra\Storage\Repositories\EloquentChunkedUploadRepository;
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
     * {@see \Stackra\Storage\Jobs\PurgeAbortedChunkedUploadsJob}.
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
