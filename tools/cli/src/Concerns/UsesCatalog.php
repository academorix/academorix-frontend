<?php

/**
 * @file UsesCatalog.php
 * @module Academorix\Cli\Concerns
 * @description Convenience accessors around {@see \Academorix\Cli\Catalog\CatalogReader}
 *   and {@see \Academorix\Cli\Catalog\CatalogQuery}. Concrete commands go through
 *   these methods rather than resolving the services directly.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Catalog\CatalogEntry;
use Academorix\Cli\Catalog\CatalogQuery;
use Academorix\Cli\Catalog\CatalogReader;
use Academorix\Cli\Catalog\CatalogSelection;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
 */
trait UsesCatalog
{
    public function catalog(): CatalogReader
    {
        return $this->container->resolve(CatalogReader::class);
    }

    public function catalogQuery(): CatalogQuery
    {
        return $this->container->resolve(CatalogQuery::class);
    }

    /**
     * @return array<int, CatalogEntry>
     */
    public function findPackagesForCapability(string $capability): array
    {
        return array_values(array_filter(
            $this->catalog()->all(),
            static fn (CatalogEntry $e): bool => in_array($capability, $e->capabilities, true),
        ));
    }

    /**
     * @return array<int, CatalogEntry>
     */
    public function packagesByTier(string $tier): array
    {
        return $this->catalog()->byTier($tier);
    }

    /**
     * @param  array<int, string>  $capabilities
     */
    public function resolveSelection(array $capabilities): CatalogSelection
    {
        return $this->catalogQuery()->resolvePackages($capabilities);
    }
}
