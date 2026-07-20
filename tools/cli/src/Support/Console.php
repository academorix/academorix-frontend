<?php

/**
 * @file Console.php
 * @module Academorix\Cli\Support
 * @description Static I/O helpers around Symfony Console. Every command
 *   pulls arguments and options through here to normalise nullability.
 */

declare(strict_types=1);

namespace Academorix\Cli\Support;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Static helpers — do not instantiate.
 */
final class Console
{
    /**
     * Read a positional argument. Returns `null` when the argument was
     * not supplied.
     */
    public static function arg(InputInterface $input, string $name): ?string
    {
        if (! $input->hasArgument($name)) {
            return null;
        }
        $value = $input->getArgument($name);
        if ($value === null || $value === '') {
            return null;
        }

        return is_array($value) ? implode(' ', $value) : (string) $value;
    }

    /**
     * Read a named option. Returns `null` when unset.
     */
    public static function opt(InputInterface $input, string $name): ?string
    {
        if (! $input->hasOption($name)) {
            return null;
        }
        $value = $input->getOption($name);
        if ($value === null || $value === '' || $value === false) {
            return null;
        }
        if (is_array($value)) {
            return $value === [] ? null : implode(',', array_map('strval', $value));
        }

        return (string) $value;
    }

    /**
     * Numeric verbosity level of the current output.
     */
    public static function verbosity(OutputInterface $output): int
    {
        return $output->getVerbosity();
    }
}
