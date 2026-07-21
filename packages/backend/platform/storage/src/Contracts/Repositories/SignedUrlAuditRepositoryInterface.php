<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Storage\Models\SignedUrlAudit;
use Stackra\Storage\Repositories\EloquentSignedUrlAuditRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SignedUrlAudit}.
 *
 * @extends RepositoryInterface<SignedUrlAudit>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(EloquentSignedUrlAuditRepository::class)]
interface SignedUrlAuditRepositoryInterface extends RepositoryInterface
{
    /**
     * Look up an audit row by its signature hash — the redemption
     * middleware hashes the incoming signature and reaches the row
     * through this call.
     */
    public function findBySignatureHash(string $hash): ?SignedUrlAudit;

    /**
     * Every audit row whose `expires_at <= $now` and that has NOT
     * been revoked yet. Consumed by
     * {@see \Stackra\Storage\Jobs\RevokeExpiredSignedUrlsJob}.
     *
     * @return Collection<int, SignedUrlAudit>
     */
    public function findExpiredUnrevoked(\DateTimeInterface $now): Collection;

    /**
     * Every audit row for a given File — bulk revoke path.
     *
     * @return Collection<int, SignedUrlAudit>
     */
    public function findByFile(string $fileId): Collection;
}
