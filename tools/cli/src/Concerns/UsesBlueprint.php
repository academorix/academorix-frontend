<?php

/**
 * @file UsesBlueprint.php
 * @module Stackra\Cli\Concerns
 * @description Delegates to {@see \Stackra\Cli\Blueprint\BlueprintReader}
 *   and {@see \Stackra\Cli\Blueprint\BlueprintValidator}. Blueprint
 *   validation shells to the workspace Python validator.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Blueprint\BlueprintReader;
use Stackra\Cli\Blueprint\BlueprintValidator;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 *
 * @property \Stackra\Cli\Container $container populated by {@see \Stackra\Cli\Commands\AbstractCommand}
 */
trait UsesBlueprint
{
    /**
     * Read every JSON file under `blueprints/<moduleName>/` into a single
     * associative array keyed by basename.
     *
     * @return array<string, mixed>
     */
    public function readBlueprint(string $moduleName): array
    {
        return $this->container->resolve(BlueprintReader::class)->read($moduleName);
    }

    /**
     * Run `validate-module-graph.py --json` against the workspace's
     * blueprint tree. Returns the parsed validation report.
     *
     * @return array<string, mixed>
     */
    public function validateBlueprints(): array
    {
        return $this->container->resolve(BlueprintValidator::class)->validate();
    }
}
