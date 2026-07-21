<?php

/**
 * @file UsesTemplates.php
 * @module Stackra\Cli\Concerns
 * @description Delegates to {@see \Stackra\Cli\Templates\TemplateManager}.
 *   Commands clone a template directory (backend-app / web-app / mobile-app)
 *   into a destination and hydrate every text file with tokens.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Templates\TemplateManager;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 *
 * @property \Stackra\Cli\Container $container populated by {@see \Stackra\Cli\Commands\AbstractCommand}
 */
trait UsesTemplates
{
    /**
     * Clone a template into `$destination` and hydrate every text file with
     * `$tokens`. Optional `$onPostInstall` closure runs after hydration.
     *
     * @param  array<string, mixed>  $tokens
     */
    public function cloneTemplate(string $kind, string $destination, array $tokens, ?callable $onPostInstall = null): void
    {
        $this->container->resolve(TemplateManager::class)
            ->clone($kind, $destination, $tokens, $onPostInstall);
    }
}
