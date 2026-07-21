<?php

declare(strict_types=1);

/**
 * AsCommand Attribute.
 *
 * Extends Symfony's AsCommand attribute to add support for command extension.
 * Commands can declare that they extend another command, and the compiler
 * will automatically register them as extensions.
 *
 * ## Usage:
 * ```php
 * use Stackra\Console\Attributes\AsCommand;
 *
 * // Simple command (same as Symfony's AsCommand)
 * #[AsCommand(name: 'my:command', description: 'My command')]
 * class MyCommand extends BaseCommand { }
 *
 * // Command that extends another command
 * #[AsCommand(
 *     name: 'di:clear',
 *     description: 'Clear DI artifacts',
 *     extends: 'app:clear',
 *     priority: 60,
 *     extensionDescription: 'DI compiled artifacts',
 * )]
 * class ClearCompiledCommand extends BaseCommand { }
 * ```
 *
 * @category Console
 *
 * @since    1.0.0
 */

namespace Stackra\Console\Attributes;

use Attribute;

/**
 * Attribute for defining console commands with optional extension support.
 *
 * Note: This does not extend Symfony's AsCommand because it's final in newer versions.
 * Laravel's command discovery will still work with this attribute.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class AsCommand
{
    /**
     * Create a new AsCommand attribute instance.
     *
     * @param  string  $name  The command name (e.g., 'app:clear').
     * @param  string|null  $description  The command description.
     * @param  array<string>  $aliases  Command aliases.
     * @param  bool  $hidden  Whether the command is hidden from the list.
     * @param  string|null  $extends  The parent command name to extend (e.g., 'app:clear').
     * @param  int  $priority  Priority when running as extension (lower = earlier).
     * @param  string|null  $extensionDescription  Description shown when running as extension.
     */
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly array $aliases = [],
        public readonly bool $hidden = false,
        public readonly ?string $extends = null,
        public readonly int $priority = 100,
        public readonly ?string $extensionDescription = null,
    ) {}

    /**
     * Check if this command extends another command.
     */
    public function hasExtension(): bool
    {
        return $this->extends !== null;
    }

    /**
     * Get the extension description, falling back to the command description.
     */
    public function getExtensionDescription(): string
    {
        return $this->extensionDescription ?? $this->description ?? $this->name;
    }
}
