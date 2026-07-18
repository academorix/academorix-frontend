<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a lookup expects an entitlement row but finds none.
 *
 * Common cause: the tenant hasn't been provisioned for the key yet,
 * or a plan sync is pending.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementNotFoundException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'entitlements.not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'entitlements::errors.not_found';

    /**
     * Convenience factory used by the resolver's raise path.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $key       Dot-separated identifier that could not be resolved.
     */
    public static function forKey(string $tenantId, string $key): self
    {
        return (new self(\sprintf(
            'No entitlement found for key "%s" on tenant "%s".',
            $key,
            $tenantId,
        )));
    }
}
