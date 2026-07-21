<?php

/**
 * @file PathResolver.php
 * @module Stackra\Cli\Support
 * @description Locates key workspace paths by walking upward from the
 *   current working directory. Every CLI command that reads catalogue
 *   entries or clones a template goes through here.
 */

declare(strict_types=1);

namespace Stackra\Cli\Support;

use Stackra\Cli\Exceptions\CliException;

/**
 * Static-ish resolver. Instance-based so it can be mocked in tests.
 */
final class PathResolver
{
    /**
     * Find the nearest ancestor directory containing `pnpm-workspace.yaml`.
     */
    public function workspaceRoot(?string $from = null): string
    {
        $cursor = $from ?? getcwd();
        if ($cursor === false) {
            throw CliException::forMissingWorkspaceRoot();
        }

        $cursor = realpath($cursor);
        if ($cursor === false) {
            throw CliException::forMissingWorkspaceRoot();
        }

        while ($cursor !== '/' && $cursor !== '') {
            if (is_file($cursor.'/pnpm-workspace.yaml')) {
                return $cursor;
            }
            $parent = dirname($cursor);
            if ($parent === $cursor) {
                break;
            }
            $cursor = $parent;
        }

        throw CliException::forMissingWorkspaceRoot();
    }

    /**
     * Find the nearest ancestor containing `package.json` (or
     * `composer.json` for backend packages).
     */
    public function packageRoot(string $from): string
    {
        $cursor = realpath($from);
        if ($cursor === false) {
            throw CliException::forMissingDirectory($from);
        }

        while ($cursor !== '/' && $cursor !== '') {
            if (is_file($cursor.'/package.json') || is_file($cursor.'/composer.json')) {
                return $cursor;
            }
            $parent = dirname($cursor);
            if ($parent === $cursor) {
                break;
            }
            $cursor = $parent;
        }

        throw CliException::forMissingDirectory($from);
    }

    public function templatesRoot(?string $from = null): string
    {
        return $this->workspaceRoot($from).'/templates';
    }

    /**
     * Every directory under `packages/backend` and `packages/frontend`.
     * Used by CatalogReader to walk for `catalog.json`.
     *
     * @return array<int, string>
     */
    public function catalogRoots(?string $from = null): array
    {
        $root = $this->workspaceRoot($from);
        $roots = [];
        foreach (['backend', 'frontend', 'sdk', 'config'] as $tier) {
            $dir = $root.'/packages/'.$tier;
            if (is_dir($dir)) {
                $roots[] = $dir;
            }
        }

        return $roots;
    }

    public function blueprintsRoot(?string $from = null): string
    {
        return $this->workspaceRoot($from).'/blueprints';
    }
}
