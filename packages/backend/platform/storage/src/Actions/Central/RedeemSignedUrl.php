<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Central;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Stackra\Storage\Exceptions\FileNotFoundException;
use Stackra\Storage\Exceptions\SignedUrlExpiredException;
use Stackra\Storage\Exceptions\SignedUrlRevokedException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * `GET /files/{signature}` — redeem a signed URL against the
 * parent File.
 *
 * UNAUTHENTICATED — the URL signature IS the credential. Every hit
 * updates the SignedUrlAudit row's `hit_count` + `last_hit_at`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.central.redeem')]
#[Get('/files/{signature}')]
#[Middleware(['api'])]
final class RedeemSignedUrl
{
    use AsController;

    public function __construct(
        private readonly SignedUrlAuditRepositoryInterface $audits,
        private readonly FileRepositoryInterface $files,
    ) {
    }

    public function __invoke(string $signature): Response|JsonResponse
    {
        // Signature hash → audit row.
        $hash  = \hash('sha256', $signature);
        $audit = $this->audits->findBySignatureHash($hash);

        if ($audit === null) {
            throw new FileNotFoundException(\sprintf('Unknown signature "%s".', $signature));
        }

        // Fail-closed on revoked / expired signatures — the audit-hit
        // middleware already verified these, but the second check
        // guards against a race between the middleware and the
        // handler.
        $now = \Carbon\CarbonImmutable::now();
        if ($audit->{SignedUrlAuditInterface::ATTR_REVOKED_AT} !== null) {
            throw new SignedUrlRevokedException('Signed URL has been revoked.');
        }
        if ($audit->{SignedUrlAuditInterface::ATTR_EXPIRES_AT} <= $now) {
            throw new SignedUrlExpiredException('Signed URL has expired.');
        }

        $fileId = (string) $audit->{SignedUrlAuditInterface::ATTR_FILE_ID};
        $file   = $this->files->query()->withoutGlobalScopes()->find($fileId);
        if ($file === null) {
            throw new FileNotFoundException(\sprintf('File "%s" no longer exists.', $fileId));
        }

        // Record the redemption on the audit row — hit_count +
        // last_hit_at. Kept inline because the module doesn't ship
        // a `storage.audit-hit` middleware alias.
        $audit->update([
            SignedUrlAuditInterface::ATTR_HIT_COUNT   => ((int) $audit->{SignedUrlAuditInterface::ATTR_HIT_COUNT}) + 1,
            SignedUrlAuditInterface::ATTR_LAST_HIT_AT => $now,
        ]);

        $disk = (string) $file->{FileInterface::ATTR_DISK};
        $path = (string) $file->{FileInterface::ATTR_PATH};

        try {
            $stream = Storage::disk($disk)->readStream($path);
        } catch (\Throwable $e) {
            throw new FileNotFoundException(\sprintf('Storage read failed: %s', $e->getMessage()));
        }

        if ($stream === false || $stream === null) {
            throw new FileNotFoundException('File byte-stream is unavailable.');
        }

        $body = \stream_get_contents($stream);
        if (\is_resource($stream)) {
            \fclose($stream);
        }

        return \response((string) $body, 200, [
            'Content-Type'        => (string) $file->{FileInterface::ATTR_MIME_TYPE},
            'Content-Disposition' => 'inline; filename="' . $file->{FileInterface::ATTR_FILENAME} . '"',
        ]);
    }
}
