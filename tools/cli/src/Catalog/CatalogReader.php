<?php

/**
 * @file CatalogReader.php
 * @module Stackra\Cli\Catalog
 * @description Walks every `catalog.json` under `packages/{backend,
 *   frontend,sdk,config}/**` and wraps each in a
 *   {@see CatalogEntry}. First call populates a lazy cache; subsequent
 *   calls hit the cache.
 */

declare(strict_types=1);

namespace Stackra\Cli\Catalog;

use Stackra\Cli\Exceptions\CatalogException;
use Stackra\Cli\Exceptions\CliException;
use Stackra\Cli\Support\PathResolver;
use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;

/**
 * Lazy catalogue reader.
 */
final class CatalogReader
{
    /**
     * @var array<int, CatalogEntry>|null
     */
    private ?array $cache = null;

    public function __construct(
        private readonly Filesystem $filesystem,
        private readonly PathResolver $pathResolver,
    ) {}

    /**
     * @return array<int, CatalogEntry>
     */
    public function all(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $roots = $this->pathResolver->catalogRoots();
        if ($roots === []) {
            throw CatalogException::forEmptyCatalog($roots);
        }

        $entries = [];
        $finder = new Finder;
        $finder->files()->name('catalog.json')->in($roots);

        foreach ($finder as $file) {
            $path = $file->getRealPath() ?: $file->getPathname();
            $entries[] = $this->parse($path);
        }

        if ($entries === []) {
            throw CatalogException::forEmptyCatalog($roots);
        }

        $this->cache = $entries;

        return $entries;
    }

    public function byName(string $name): ?CatalogEntry
    {
        foreach ($this->all() as $entry) {
            if ($entry->name === $name) {
                return $entry;
            }
        }

        return null;
    }

    /**
     * @return array<int, CatalogEntry>
     */
    public function byTier(string $tier): array
    {
        return array_values(array_filter(
            $this->all(),
            static fn (CatalogEntry $e): bool => $e->tier === $tier,
        ));
    }

    private function parse(string $path): CatalogEntry
    {
        $raw = $this->filesystem->get($path);
        try {
            $data = json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw CliException::forInvalidJson($path, $e->getMessage());
        }
        if (! is_array($data)) {
            throw CatalogException::forInvalidCatalogEntry($path, '(root)', 'not a JSON object');
        }

        return CatalogEntry::fromArray($data, $path);
    }
}
