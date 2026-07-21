<?php

/**
 * @file CatalogException.php
 * @module Stackra\Cli\Exceptions
 * @description Catalog-specific errors. Thrown by
 *   {@see \Stackra\Cli\Catalog\CatalogReader} and
 *   {@see \Stackra\Cli\Catalog\CatalogQuery} when a catalogue entry
 *   is missing, malformed, or the workspace has zero catalogue entries
 *   at all.
 */

declare(strict_types=1);

namespace Stackra\Cli\Exceptions;

/**
 * Named factories for every catalogue error the CLI raises.
 */
final class CatalogException extends CliException
{
    public static function forMissingCatalogEntry(string $pkgName): self
    {
        return new self(
            'Catalog entry not found',
            sprintf('No catalog.json entry named "%s" was found in the workspace.', $pkgName),
            [
                'Verify the package name is spelled correctly.',
                'Run `stackra catalog:list` to see every known package.',
                'If the package is new, add a catalog.json alongside its package.json.',
            ],
            2,
        );
    }

    public static function forInvalidCatalogEntry(string $path, string $field, string $reason): self
    {
        return new self(
            'Malformed catalog entry',
            sprintf('%s: field `%s` is invalid (%s).', $path, $field, $reason),
            [
                'Open the offending catalog.json and fix the named field.',
                'Refer to `.ref/schemas/catalog.v1.json` for the current schema.',
            ],
            3,
        );
    }

    /**
     * @param  array<int, string>  $searchRoots
     */
    public static function forEmptyCatalog(array $searchRoots): self
    {
        return new self(
            'No catalog entries found',
            sprintf(
                'Walked %d search root(s) and found zero catalog.json files.',
                count($searchRoots),
            ),
            [
                'Confirm you are inside an Stackra workspace.',
                'Confirm packages/backend/** or packages/frontend/** carries at least one package.',
                'Roots walked: '.implode(', ', $searchRoots),
            ],
            3,
        );
    }
}
