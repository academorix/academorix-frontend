<?php

/**
 * @file TemplateManager.php
 * @module Stackra\Cli\Templates
 * @description Orchestrates a template clone: registry -> hydrator ->
 *   optional post-install hook (e.g. `composer install` for backend-app,
 *   `pnpm install` for web-app).
 */

declare(strict_types=1);

namespace Stackra\Cli\Templates;

use Stackra\Cli\Exceptions\TemplateException;

/**
 * Facade over {@see TemplateRegistry} + {@see TemplateHydrator}. This is
 * what `UsesTemplates` binds to via the container.
 */
final class TemplateManager
{
    public function __construct(
        private readonly TemplateRegistry $registry,
        private readonly TemplateHydrator $hydrator,
    ) {}

    /**
     * Clone `kind` into `destination`, hydrated with `tokens`, then run
     * the optional post-install hook.
     *
     * @param  array<string, mixed>  $tokens
     * @param  (callable(string): void)|null  $onPostInstall  invoked with the destination path
     */
    public function clone(string $kind, string $destination, array $tokens, ?callable $onPostInstall = null): void
    {
        if (is_dir($destination) || is_file($destination)) {
            throw TemplateException::forDestinationExists($destination);
        }

        $source = $this->registry->directoryFor($kind);
        $this->hydrator->hydrate($source, $destination, $tokens);

        if ($onPostInstall !== null) {
            $onPostInstall($destination);
        }
    }
}
