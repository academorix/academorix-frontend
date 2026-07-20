<?php

/**
 * @file StubException.php
 * @module Academorix\Cli\Exceptions
 * @description Stub-specific errors. Thrown by
 *   {@see \Academorix\Cli\Stubs\StubRenderer} and
 *   {@see \Academorix\Cli\Stubs\StubRegistry}.
 */

declare(strict_types=1);

namespace Academorix\Cli\Exceptions;

/**
 * Named factories for every stub error the CLI raises.
 */
final class StubException extends CliException
{
    public static function forMissingStub(string $logicalName): self
    {
        return new self(
            'Unknown stub',
            sprintf('No stub named "%s" is registered.', $logicalName),
            [
                'Check the spelling of the logical stub name.',
                'The registry lives at src/Stubs/StubRegistry.php.',
            ],
            2,
        );
    }

    public static function forMissingStubFile(string $path): self
    {
        return new self(
            'Stub file missing on disk',
            sprintf('%s does not exist.', $path),
            [
                'Restore the stub file from source control.',
                'If the registry is out of sync with the stubs directory, run `composer dump-autoload` and re-run.',
            ],
            3,
        );
    }

    public static function forMissingToken(string $stubName, string $tokenName): self
    {
        return new self(
            'Stub token not supplied',
            sprintf('Stub "%s" requires a value for token "%s".', $stubName, $tokenName),
            [
                'Pass the token as part of the render tokens array.',
                'To render loosely (leave unresolved markers in the file), disable strict mode.',
            ],
            2,
        );
    }
}
