<?php

/**
 * @file src/Exceptions/ScopeConflictException.php
 *
 * @description
 * Thrown by the registry when two packages attempt to register
 * under the same namespace. Kept distinct from
 * {@see ScopeValidationException} so consumers can specifically
 * detect "already installed" and either swap-in or bail cleanly.
 */

declare(strict_types=1);

namespace Academorix\Scope\Exceptions;

/**
 * Two consumers claimed the same namespace.
 *
 * A double-registration is almost always a bug (two providers
 * running by mistake, package copy/paste, or an install script
 * running twice). Fail loud instead of silently taking the second
 * write.
 */
final class ScopeConflictException extends ScopeException
{
    /**
     * @param  string  $namespace  The clashing namespace.
     */
    public static function namespaceAlreadyRegistered(string $namespace): self
    {
        return new self(
            \sprintf(
                'Scope consumer namespace "%s" is already registered. '
                .'Two packages claim the same namespace — inspect the '
                .'call sites and rename one.',
                $namespace,
            ),
        );
    }
}
