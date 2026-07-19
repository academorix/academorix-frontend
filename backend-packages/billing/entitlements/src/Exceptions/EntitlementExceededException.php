<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a consumption would exceed the entitlement cap.
 *
 * Yields HTTP 402 Payment Required — the caller should upgrade their
 * plan to increase the cap. Middleware maps the exception to the
 * appropriate JSON envelope automatically.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementExceededException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'entitlements.exceeded';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'entitlements::errors.exceeded';

    /**
     * HTTP status — 402 Payment Required signals a billing-related
     * denial to the caller.
     */
    public const int STATUS_CODE = 402;

    /**
     * Convenience factory used by the enforcer's raise path.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $key       Dot-separated identifier that was exceeded.
     */
    public static function forKey(string $tenantId, string $key): self
    {
        return (new self(\sprintf(
            'Entitlement "%s" quota exceeded for tenant "%s".',
            $key,
            $tenantId,
        )));
    }
}
