<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Data\FileVariantInterface;
use Academorix\Storage\Contracts\Data\SignedUrlAuditInterface;
use Academorix\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Academorix\Storage\Exceptions\FileNotFoundException;
use Academorix\Storage\Exceptions\SignedUrlExpiredException;
use Academorix\Storage\Exceptions\SignedUrlRevokedException;
use Academorix\Storage\Models\FileVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * `GET /files/{signature}/{variant}` — redeem a signed URL against
 * a specific FileVariant.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.central.redeem_variant')]
#[Get('/files/{signature}/{variant}')]
#[Middleware(['api'])]
final class RedeemSignedVariantUrl
{
    use AsController;

    public function __construct(
        private readonly SignedUrlAuditRepositoryInterface $audits,
    ) {
    }

    public function __invoke(string $signature, string $variant): Response|JsonResponse
    {
        $hash  = \hash('sha256', $signature);
        $audit = $this->audits->findBySignatureHash($hash);

        if ($audit === null) {
            throw new FileNotFoundException(\sprintf('Unknown signature "%s".', $signature));
        }

        $now = \Carbon\CarbonImmutable::now();
        if ($audit->{SignedUrlAuditInterface::ATTR_REVOKED_AT} !== null) {
            throw new SignedUrlRevokedException('Signed URL has been revoked.');
        }
        if ($audit->{SignedUrlAuditInterface::ATTR_EXPIRES_AT} <= $now) {
            throw new SignedUrlExpiredException('Signed URL has expired.');
        }

        $fileId = (string) $audit->{SignedUrlAuditInterface::ATTR_FILE_ID};

        // Record redemption inline — this module doesn't ship a
        // `storage.audit-hit` middleware alias.
        $audit->update([
            SignedUrlAuditInterface::ATTR_HIT_COUNT   => ((int) $audit->{SignedUrlAuditInterface::ATTR_HIT_COUNT}) + 1,
            SignedUrlAuditInterface::ATTR_LAST_HIT_AT => $now,
        ]);

        /** @var FileVariant|null $row */
        $row = FileVariant::query()
            ->withoutGlobalScopes()
            ->where(FileVariantInterface::ATTR_FILE_ID, $fileId)
            ->where(FileVariantInterface::ATTR_VARIANT_KEY, $variant)
            ->first();

        if ($row === null) {
            throw new FileNotFoundException(\sprintf('Variant "%s" not found for file "%s".', $variant, $fileId));
        }

        $disk = (string) $row->{FileVariantInterface::ATTR_DISK};
        $path = (string) $row->{FileVariantInterface::ATTR_PATH};

        try {
            $stream = Storage::disk($disk)->readStream($path);
        } catch (\Throwable $e) {
            throw new FileNotFoundException(\sprintf('Storage read failed: %s', $e->getMessage()));
        }

        if ($stream === false || $stream === null) {
            throw new FileNotFoundException('Variant byte-stream is unavailable.');
        }

        $body = \stream_get_contents($stream);
        if (\is_resource($stream)) {
            \fclose($stream);
        }

        return \response((string) $body, 200, [
            'Content-Type' => (string) $row->{FileVariantInterface::ATTR_MIME_TYPE},
        ]);
    }
}
