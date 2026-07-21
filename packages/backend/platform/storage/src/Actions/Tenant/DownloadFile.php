<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Stackra\Storage\Enums\SignedUrlPurpose;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Illuminate\Http\RedirectResponse;

/**
 * `GET /api/v1/files/{file}/download` — issue a short-lived signed
 * URL and redirect to it. Convenience wrapper over `POST /signed-url`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.download')]
#[Get('/api/v1/files/{file}/download')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.antivirus.gate', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class DownloadFile
{
    use AsController;

    public function __construct(
        private readonly SignedUrlIssuerInterface $issuer,
    ) {
    }

    public function __invoke(File $file): RedirectResponse
    {
        $ttl   = (int) \config('storage.signed_urls.ttl_policy.download', 3600);
        $audit = $this->issuer->issue($file, null, SignedUrlPurpose::Download, $ttl);

        $meta = (array) ($audit->metadata ?? []);
        $url  = (string) ($meta['url'] ?? '');

        return \redirect()->away($url);
    }
}
