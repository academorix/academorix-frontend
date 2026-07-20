<?php

/**
 * @file CatalogSelection.php
 * @module Academorix\Cli\Catalog
 * @description Result of a {@see \Academorix\Cli\Catalog\CatalogQuery::resolvePackages()}
 *   call. Wraps a deduplicated list of {@see CatalogEntry} with lookup
 *   helpers.
 */

declare(strict_types=1);

namespace Academorix\Cli\Catalog;

/**
 * A read-only view over a set of resolved catalogue entries.
 */
final class CatalogSelection
{
    /**
     * @var array<int, CatalogEntry>
     */
    private readonly array $entries;

    /**
     * @param  array<int, CatalogEntry>  $entries
     */
    public function __construct(array $entries)
    {
        $seen = [];
        $deduped = [];
        foreach ($entries as $entry) {
            if (isset($seen[$entry->name])) {
                continue;
            }
            $seen[$entry->name] = true;
            $deduped[] = $entry;
        }
        $this->entries = $deduped;
    }

    /**
     * @return array<int, CatalogEntry>
     */
    public function all(): array
    {
        return $this->entries;
    }

    public function count(): int
    {
        return count($this->entries);
    }

    /**
     * @return array<int, CatalogEntry>
     */
    public function byTier(string $tier): array
    {
        return array_values(array_filter(
            $this->entries,
            static fn (CatalogEntry $e): bool => $e->tier === $tier,
        ));
    }

    public function hasPackage(string $name): bool
    {
        foreach ($this->entries as $entry) {
            if ($entry->name === $name) {
                return true;
            }
        }

        return false;
    }

    public function isEmpty(): bool
    {
        return $this->entries === [];
    }
}
