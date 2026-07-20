<?php

/**
 * @file UsesLaravelPrompts.php
 * @module Academorix\Cli\Concerns
 * @description Thin wrapper around Laravel Prompts. Every wrapper falls back
 *   to a supplied default in non-interactive terminals so CI runs don't hang.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Laravel\Prompts\Prompt;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\multiselect;
use function Laravel\Prompts\password;
use function Laravel\Prompts\select;
use function Laravel\Prompts\spin;
use function Laravel\Prompts\text;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 */
trait UsesLaravelPrompts
{
    /**
     * Prompt for free-form text.
     */
    public function askText(string $label, ?string $default = null, bool $required = true, ?string $placeholder = null): string
    {
        if ($this->promptsSuppressed()) {
            return (string) ($default ?? '');
        }

        return text(
            label: $label,
            default: $default ?? '',
            placeholder: $placeholder ?? '',
            required: $required,
        );
    }

    /**
     * Prompt for a single choice from a list.
     *
     * @param  array<string, string>  $options  value => label
     */
    public function askSelect(string $label, array $options, ?string $default = null): string
    {
        if ($this->promptsSuppressed()) {
            return $default ?? (string) array_key_first($options);
        }

        return (string) select(label: $label, options: $options, default: $default);
    }

    /**
     * Prompt for zero-or-more choices from a list.
     *
     * @param  array<string, string>  $options  value => label
     * @param  array<int, string>  $defaults
     * @return array<int, string>
     */
    public function askMultiselect(string $label, array $options, array $defaults = [], ?int $required = null): array
    {
        if ($this->promptsSuppressed()) {
            return $defaults;
        }

        /** @var array<int, string> */
        return multiselect(
            label: $label,
            options: $options,
            default: $defaults,
            required: $required !== null,
        );
    }

    /**
     * Prompt for a yes/no answer.
     */
    public function askConfirm(string $label, bool $default = true): bool
    {
        if ($this->promptsSuppressed()) {
            return $default;
        }

        return confirm(label: $label, default: $default);
    }

    /**
     * Prompt for a password (masked input).
     */
    public function askPassword(string $label): string
    {
        if ($this->promptsSuppressed()) {
            return '';
        }

        return password(label: $label);
    }

    /**
     * Run a task with a spinning indicator.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function spin(string $message, callable $callback): mixed
    {
        return spin($callback, $message);
    }

    /**
     * True when we cannot interactively prompt — CI, piped input, non-TTY.
     * Laravel Prompts exposes this via its own probe.
     */
    private function promptsSuppressed(): bool
    {
        return ! Prompt::shouldFallback() && ! function_exists('posix_isatty');
    }
}
