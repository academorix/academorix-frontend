<?php

declare(strict_types=1);

namespace Academorix\Storage\Contracts\Services;

use Academorix\Storage\Enums\SignedUrlPurpose;
use Academorix\Storage\Models\File;
use Academorix\Storage\Models\SignedUrlAudit;
use Academorix\Storage\Services\DefaultSignedUrlIssuer;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the signed-URL issuer.
 *
 * Delegates to the driver's temporary-URL support (S3 pre-signed,
 * GCS signed, local HMAC) so every driver looks the same on the
 * wire. Every issuance writes a {@see SignedUrlAudit} row so
 * revocation + compliance reads work uniformly.
 *
 * `#[Bind(DefaultSignedUrlIssuer::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(DefaultSignedUrlIssuer::class)]
interface SignedUrlIssuerInterface
{
    /**
     * Issue a signed URL and persist the matching audit row.
     *
     * @param  File              $file         Target file.
     * @param  string|null       $variantKey   Optional variant key —
     *                                         when set, the URL
     *                                         resolves the variant
     *                                         rather than the parent.
     * @param  SignedUrlPurpose  $purpose      Purpose (drives TTL).
     * @param  int               $ttlSeconds   Requested TTL — capped
     *                                         at the plan tier's max.
     * @param  string|null       $ipLock       Optional CIDR IP lock.
     * @param  string|null       $userLock     Optional user id lock.
     * @return SignedUrlAudit    The persisted audit row. The URL
     *                           itself is available via
     *                           `metadata.url` on the returned row
     *                           (never persisted in a column).
     */
    public function issue(
        File $file,
        ?string $variantKey,
        SignedUrlPurpose $purpose,
        int $ttlSeconds,
        ?string $ipLock = null,
        ?string $userLock = null,
    ): SignedUrlAudit;

    /**
     * Revoke every unrevoked audit row for a file.
     *
     * @return int  Number of rows revoked.
     */
    public function revokeAllForFile(string $fileId, string $reason): int;
}
