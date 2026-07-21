<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Exceptions;

use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Exceptions\StackraException;

/**
 * Raised when a consumer expects one kind but the stored row is
 * another (e.g. `consume(int)` invoked on a `boolean`-kind row).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementKindMismatchException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'entitlements.kind_mismatch';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'entitlements::errors.kind_mismatch';

    /**
     * Convenience factory used by the enforcer's kind-check path.
     *
     * @param  string           $key       Dot-separated identifier.
     * @param  EntitlementKind  $actual    The kind stored on the row.
     * @param  EntitlementKind  $expected  The kind the consumer expected.
     */
    public static function forKey(string $key, EntitlementKind $actual, EntitlementKind $expected): self
    {
        return (new self(\sprintf(
            'Entitlement "%s" has kind %s but consumer expected %s.',
            $key,
            $actual->value,
            $expected->value,
        )));
    }
}
