<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Stackra\Storage\Data\Requests\IssueSignedUrlRequestData;
use Stackra\Storage\Data\SignedUrlAuditData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;

/**
 * `POST /api/v1/files/{file}/signed-url` — issue a signed URL.
 *
 * TTL is capped against the per-plan-tier maximum. Every issuance
 * writes a {@see \Stackra\Storage\Models\SignedUrlAudit} row.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.signed_url.issue')]
#[Post('/api/v1/files/{file}/signed-url')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.antivirus.gate', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class IssueSignedUrl
{
    use AsController;

    public function __construct(
        private readonly SignedUrlIssuerInterface $issuer,
    ) {
    }

    public function __invoke(File $file, IssueSignedUrlRequestData $data): SignedUrlAuditData
    {
        // Resolve TTL — caller override wins, else per-purpose policy,
        // else global default.
        $ttl = $data->ttlSeconds
            ?? (int) \config('storage.signed_urls.ttl_policy.' . $data->purpose->value, \config('storage.signed_urls.default_ttl_seconds', 3600));

        // Cap against the global max — plan-tier caps land on top
        // later via the entitlements package.
        $cap = (int) \config('storage.signed_urls.max_ttl_seconds', 2_592_000);
        $ttl = \min($ttl, $cap);

        $audit = $this->issuer->issue(
            $file,
            $data->variantKey,
            $data->purpose,
            $ttl,
            $data->ipLock,
            $data->userLock,
        );

        return SignedUrlAuditData::fromModel($audit);
    }
}
