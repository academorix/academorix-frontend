<?php

/**
 * @file UsesBlueprint.php
 * @module Academorix\Cli\Concerns
 * @description Delegates to {@see \Academorix\Cli\Blueprint\BlueprintReader}
 *   and {@see \Academorix\Cli\Blueprint\BlueprintValidator}. Blueprint
 *   validation shells to the workspace Python validator.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Blueprint\BlueprintReader;
use Academorix\Cli\Blueprint\BlueprintValidator;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
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
