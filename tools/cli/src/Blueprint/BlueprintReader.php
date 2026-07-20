<?php

/**
 * @file BlueprintReader.php
 * @module Academorix\Cli\Blueprint
 * @description Reads every `*.json` under `blueprints/<moduleName>/`
 *   and merges into a single associative array keyed by basename.
 *   `module.json` becomes `'module' => [...]`; `routes.json` becomes
 *   `'routes' => [...]`; and so on.
 */

declare(strict_types=1);

namespace Academorix\Cli\Blueprint;

use Academorix\Cli\Exceptions\BlueprintException;
use Academorix\Cli\Exceptions\CliException;
use Academorix\Cli\Support\PathResolver;
use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;

/**
 * Loads a module's blueprint into a single flat map.
 */
final class BlueprintReader
{
    public function __construct(
        private readonly Filesystem $filesystem,
        private readonly PathResolver $pathResolver,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function read(string $moduleName): array
    {
        $moduleDir = $this->locateModuleDir($moduleName);

        $finder = new Finder;
        $finder->files()->in($moduleDir)->name('*.json')->depth(0);

        $blueprint = [];
        foreach ($finder as $file) {
            $key = $file->getFilenameWithoutExtension();
            $body = $this->filesystem->get($file->getRealPath() ?: $file->getPathname());
            try {
                $decoded = json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);
            } catch (\JsonException $e) {
                throw CliException::forInvalidJson($file->getPathname(), $e->getMessage());
            }
            $blueprint[$key] = $decoded;
        }

        if ($blueprint === []) {
            throw BlueprintException::forMissingModuleBlueprint($moduleName);
        }

        return $blueprint;
    }

    private function locateModuleDir(string $moduleName): string
    {
        $root = $this->pathResolver->blueprintsRoot();

        // Module identifier may be `<tier>/<slug>` or bare `<slug>`.
        if (str_contains($moduleName, '/')) {
            $candidate = $root.'/'.$moduleName;
            if (is_dir($candidate)) {
                return $candidate;
            }
        }

        // Fall back to searching every tier.
        $tiers = ['shared', 'identity', 'platform', 'access', 'billing', 'notifications', 'compliance', 'products', 'sports', 'finance', 'growth', 'observability', 'workflow'];
        foreach ($tiers as $tier) {
            $candidate = $root.'/'.$tier.'/'.$moduleName;
            if (is_dir($candidate)) {
                return $candidate;
            }
        }

        throw BlueprintException::forMissingModuleBlueprint($moduleName);
    }
}
