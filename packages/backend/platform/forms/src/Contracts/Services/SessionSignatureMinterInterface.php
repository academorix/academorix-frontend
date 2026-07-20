<?php

declare(strict_types=1);

namespace Academorix\Forms\Contracts\Services;

use Academorix\Forms\Services\SessionSignatureMinter;
use Illuminate\Container\Attributes\Bind;

/**
 * Mints + verifies HMAC signatures on form-session identifiers.
 *
 * A public form (season registration, medical questionnaire) allows
 * an anonymous / partially-authenticated caller to resume a
 * submission across devices. The client persists a session token
 * (URL param + cookie) that survives the round-trip; without a
 * cryptographic seal, an attacker could forge tokens and enumerate
 * other tenants' draft submissions.
 *
 * This service is the seal. Sign the tuple
 * `(submission_id, form_version_id, tenant_id, exp)` with a
 * per-tenant HMAC key, hand the client the base64url-encoded
 * signature, verify on every subsequent write. Expired signatures
 * fail closed.
 *
 * Concrete: {@see SessionSignatureMinter}.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Bind(SessionSignatureMinter::class)]
interface SessionSignatureMinterInterface
{
    /**
     * Mint a signature for a form-session tuple.
     *
     * @param  string  $submissionId    Session's FormSubmission id.
     * @param  string  $formVersionId   Bound FormVersion id.
     * @param  string  $tenantId        Owning tenant.
     * @param  int     $ttlSeconds      Signature validity in seconds (default 24h).
     *
     * @return string  Base64url-encoded HMAC-SHA256 signature.
     */
    public function mint(string $submissionId, string $formVersionId, string $tenantId, int $ttlSeconds = 86400): string;

    /**
     * Verify a signature.
     *
     * Constant-time comparison so signature length + prefix
     * matches don't leak side-channel timing.
     *
     * @return bool  True iff the signature is valid AND not expired.
     */
    public function verify(string $signature, string $submissionId, string $formVersionId, string $tenantId): bool;
}
