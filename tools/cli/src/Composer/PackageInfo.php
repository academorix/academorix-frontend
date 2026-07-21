<?php

/**
 * @file PackageInfo.php
 * @module Stackra\Cli\Composer
 * @description Readonly DTO for a single composer.json entry in the
 *   workspace. Carries the `name` field + the absolute paths to the
 *   composer.json file and its containing directory. Consumed by
 *   {@see ComposerPathRepoWirer} to compute relative path repositories.
 */

declare(strict_types=1);

namespace Stackra\Cli\Composer;

/**
 * Immutable view of a workspace composer.json package.
 */
final readonly class PackageInfo
{
    public function __construct(
        public string $name,
        public string $path,
        public string $dir,
    ) {}
}
