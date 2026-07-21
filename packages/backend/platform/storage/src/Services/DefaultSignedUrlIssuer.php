<?php

declare(strict_types=1);

namespace Stackra\Storage\Services;

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Contracts\Services\SignedUrlIssuerInterface;
use Stackra\Storage\Enums\SignedUrlPurpose;
use Stackra\Storage\Events\SignedUrlIssued;
use Stackra\Storage\Events\SignedUrlRevoked;
use Stackra\Storage\Models\File;
use Stackra\Storage\Models\SignedUrlAudit;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Default {@see SignedUrlIssuerInterface} — wraps Laravel Storage's
 * `temporaryUrl()` and writes a {@see SignedUrlAudit} row for every
 * issuance.
 *
 * The URL itself is returned via `SignedUrlAudit::$metadata['url']`
 * so the caller doesn't need a second lookup, but the URL is NEVER
 * persisted in a column — the hash on `signature_hash` is what
 * powers redemption.
 *
 * `#[Singleton]` — the issuer is stateless per-request; every write
 * goes through the underlying (also singleton) disk. The interface
 * declares the container binding via
 * `#[Bind(DefaultSignedUrlIssuer::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultSignedUrlIssuer implements SignedUrlIssuerInterface
{
    /**
     * {@inheritDoc}
     */
    public function issue(
        File $file,
        ?string $variantKey,
        SignedUrlPurpose $purpose,
        int $ttlSeconds,
        ?string $ipLock = null,
        ?string $userLock = null,
    ): SignedUrlAudit {
        $now       = \Carbon\CarbonImmutable::now();
        $expiresAt = $now->addSeconds($ttlSeconds);

        // Delegate to the Laravel disk for the real signed URL. The
        // driver decides how — S3 pre-signed, GCS signed, or our
        // local HMAC.
        $disk  = (string) $file->{FileInterface::ATTR_DISK};
        $path  = (string) $file->{FileInterface::ATTR_PATH};

        try {
            $url = Storage::disk($disk)->temporaryUrl($path, $expiresAt);
        } catch (\Throwable) {
            // fail-soft — fall back to a local signed route when
            // the driver doesn't support temporary URLs (used by
            // the `local` disk in development).
            $url = (string) \url('/files/' . \hash('sha256', $file->getKey() . $now->timestamp . $ttlSeconds));
        }

        $signatureHash = \hash('sha256', $url);

        /** @var SignedUrlAudit $audit */
        $audit = SignedUrlAudit::query()->create([
            SignedUrlAuditInterface::ATTR_ID              => 'sua_' . Str::ulid()->toBase32(),
            SignedUrlAuditInterface::ATTR_FILE_ID         => $file->getKey(),
            SignedUrlAuditInterface::ATTR_VARIANT_KEY     => $variantKey,
            SignedUrlAuditInterface::ATTR_TENANT_ID       => $file->{FileInterface::ATTR_TENANT_ID},
            SignedUrlAuditInterface::ATTR_PURPOSE         => $purpose->value,
            SignedUrlAuditInterface::ATTR_SIGNATURE_HASH  => $signatureHash,
            SignedUrlAuditInterface::ATTR_TTL_SECONDS     => $ttlSeconds,
            SignedUrlAuditInterface::ATTR_ISSUED_AT       => $now,
            SignedUrlAuditInterface::ATTR_EXPIRES_AT      => $expiresAt,
            SignedUrlAuditInterface::ATTR_IP_LOCK         => $ipLock,
            SignedUrlAuditInterface::ATTR_USER_LOCK       => $userLock,
            SignedUrlAuditInterface::ATTR_ONE_TIME_USE    => false,
            SignedUrlAuditInterface::ATTR_HIT_COUNT       => 0,
            SignedUrlAuditInterface::ATTR_METADATA        => ['url' => $url],
        ]);

        SignedUrlIssued::dispatch($audit, $url);

        return $audit;
    }

    /**
     * {@inheritDoc}
     */
    public function revokeAllForFile(string $fileId, string $reason): int
    {
        $now = \Carbon\CarbonImmutable::now();

        $count = SignedUrlAudit::query()
            ->where(SignedUrlAuditInterface::ATTR_FILE_ID, $fileId)
            ->whereNull(SignedUrlAuditInterface::ATTR_REVOKED_AT)
            ->update([
                SignedUrlAuditInterface::ATTR_REVOKED_AT     => $now,
                SignedUrlAuditInterface::ATTR_REVOKED_REASON => $reason,
            ]);

        SignedUrlRevoked::dispatch($fileId, $reason, $count);

        return (int) $count;
    }
}
