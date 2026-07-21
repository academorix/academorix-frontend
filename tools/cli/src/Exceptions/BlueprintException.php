<?php

/**
 * @file BlueprintException.php
 * @module Stackra\Cli\Exceptions
 * @description Blueprint-specific errors. Thrown by
 *   {@see \Stackra\Cli\Blueprint\BlueprintReader} and
 *   {@see \Stackra\Cli\Blueprint\BlueprintValidator}.
 */

declare(strict_types=1);

namespace Stackra\Cli\Exceptions;

/**
 * Named factories for every blueprint error the CLI raises.
 */
final class BlueprintException extends CliException
{
    public static function forMissingModuleBlueprint(string $moduleName): self
    {
        return new self(
            'Module blueprint not found',
            sprintf('No blueprints/**/%s/ directory was found in the workspace.', $moduleName),
            [
                'Verify the module name is spelled correctly.',
                'Run `stackra module:new '.$moduleName.'` to scaffold it.',
            ],
            2,
        );
    }

    public static function forInvalidBlueprintShape(string $moduleName, string $field, string $reason): self
    {
        return new self(
            'Malformed blueprint',
            sprintf('Blueprint for "%s" has an invalid `%s` (%s).', $moduleName, $field, $reason),
            [
                'Open the module.json (or the relevant *.json) and fix the named field.',
                'Refer to `.ref/DOMAIN_MODULES_BLUEPRINT.md` for the expected shape.',
            ],
            3,
        );
    }

    public static function forValidatorFailure(string $stderr): self
    {
        return new self(
            'Blueprint validator failed',
            'validate-module-graph.py exited with a non-zero status.',
            [
                'Its final output was:',
                $stderr === '' ? '(no output)' : $stderr,
            ],
            4,
        );
    }
}
