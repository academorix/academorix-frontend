<?php

/**
 * @file WirerReport.php
 * @module Academorix\Cli\Composer
 * @description Mutable report produced by
 *   {@see ComposerPathRepoWirer::run()}. Tracks the counts + the two
 *   lists downstream consumers care about: which files changed
 *   (`changes`), and which `@dev` deps had no matching package in the
 *   workspace (`unresolved`).
 */

declare(strict_types=1);

namespace Academorix\Cli\Composer;

/**
 * Aggregate report for one wire-up pass.
 */
final class WirerReport
{
    public int $touched = 0;

    public int $skipped = 0;

    /** @var list<string> `source-package -> unresolved-dep-name` */
    public array $unresolved = [];

    /** @var list<string> One-line change summaries per touched file */
    public array $changes = [];
}
