<?php

/**
 * @file TemplateException.php
 * @module Stackra\Cli\Exceptions
 * @description Template-specific errors. Thrown by
 *   {@see \Stackra\Cli\Templates\TemplateRegistry},
 *   {@see \Stackra\Cli\Templates\TemplateHydrator}, and
 *   {@see \Stackra\Cli\Templates\TemplateManager}.
 */

declare(strict_types=1);

namespace Stackra\Cli\Exceptions;

/**
 * Named factories for every template error the CLI raises.
 */
final class TemplateException extends CliException
{
    public static function forMissingTemplateDir(string $kind): self
    {
        return new self(
            'Template not found',
            sprintf('No template directory registered for kind "%s".', $kind),
            [
                'This is expected in the v0.1 CLI — templates ship separately.',
                'Once templates/<kind>/ exists in the workspace, this command will scaffold from it.',
            ],
            3,
        );
    }

    /**
     * @param  array<int, string>  $valid
     */
    public static function forInvalidTemplateKind(string $kind, array $valid): self
    {
        return new self(
            'Unknown template kind',
            sprintf('"%s" is not a template kind the CLI recognises.', $kind),
            [
                'Valid kinds: '.implode(', ', $valid),
            ],
            2,
        );
    }

    public static function forDestinationExists(string $path): self
    {
        return new self(
            'Template destination already exists',
            sprintf('Cannot hydrate template into %s — the path already exists.', $path),
            [
                'Pick a different destination, or',
                'Remove the existing directory first.',
            ],
            2,
        );
    }
}
