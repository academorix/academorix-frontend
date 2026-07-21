<?php

/**
 * @file CatalogEntry.php
 * @module Stackra\Cli\Catalog
 * @description Read-only DTO for a single `catalog.json` entry. Fields map
 *   the schema at `.ref/schemas/catalog.v1.json` exactly.
 */

declare(strict_types=1);

namespace Stackra\Cli\Catalog;

use Stackra\Cli\Exceptions\CatalogException;

/**
 * A single package's catalogue entry. Constructed only via
 * {@see fromArray()} so validation lives in one place.
 */
final class CatalogEntry
{
    /**
     * @param  list<string>  $surfaces
     * @param  list<string>  $capabilities
     * @param  list<string>  $peerDeps
     * @param  array<string, float>  $sizeGzipKb
     * @param  list<string>  $docs
     */
    public function __construct(
        public readonly string $name,
        public readonly string $tier,
        public readonly array $surfaces,
        public readonly string $kind,
        public readonly string $purpose,
        public readonly array $capabilities,
        public readonly ?string $whenToUse,
        public readonly ?string $whenNotToUse,
        public readonly array $peerDeps,
        public readonly ?string $backendPair,
        public readonly array $sizeGzipKb,
        public readonly string $maturity,
        public readonly ?string $owningAgent,
        public readonly array $docs,
        public readonly string $sourcePath,
    ) {}

    /**
     * @param  array<string, mixed>  $raw
     */
    public static function fromArray(array $raw, string $sourcePath): self
    {
        $name = self::requireString($raw, 'name', $sourcePath);
        $tier = self::requireString($raw, 'tier', $sourcePath);
        $kind = self::requireString($raw, 'kind', $sourcePath);
        $purpose = self::requireString($raw, 'purpose', $sourcePath);
        $maturity = self::requireString($raw, 'maturity', $sourcePath);

        return new self(
            name: $name,
            tier: $tier,
            surfaces: self::stringList($raw, 'surfaces'),
            kind: $kind,
            purpose: $purpose,
            capabilities: self::stringList($raw, 'capabilities'),
            whenToUse: self::optionalString($raw, 'whenToUse'),
            whenNotToUse: self::optionalString($raw, 'whenNotToUse'),
            peerDeps: self::stringList($raw, 'peerDeps'),
            backendPair: self::optionalString($raw, 'backendPair'),
            sizeGzipKb: self::floatMap($raw, 'sizeGzipKb'),
            maturity: $maturity,
            owningAgent: self::optionalString($raw, 'owningAgent'),
            docs: self::stringList($raw, 'docs'),
            sourcePath: $sourcePath,
        );
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private static function requireString(array $raw, string $field, string $sourcePath): string
    {
        $value = $raw[$field] ?? null;
        if (! is_string($value) || $value === '') {
            throw CatalogException::forInvalidCatalogEntry(
                $sourcePath,
                $field,
                'required non-empty string',
            );
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private static function optionalString(array $raw, string $field): ?string
    {
        $value = $raw[$field] ?? null;
        if ($value === null) {
            return null;
        }
        if (! is_string($value)) {
            return null;
        }

        return $value === '' ? null : $value;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return list<string>
     */
    private static function stringList(array $raw, string $field): array
    {
        $value = $raw[$field] ?? [];
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(
            array_map(static fn ($v): string => is_string($v) ? $v : '', $value),
            static fn (string $s): bool => $s !== '',
        ));
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, float>
     */
    private static function floatMap(array $raw, string $field): array
    {
        $value = $raw[$field] ?? [];
        if (! is_array($value)) {
            return [];
        }

        $result = [];
        foreach ($value as $k => $v) {
            if (is_string($k) && is_numeric($v)) {
                $result[$k] = (float) $v;
            }
        }

        return $result;
    }
}
