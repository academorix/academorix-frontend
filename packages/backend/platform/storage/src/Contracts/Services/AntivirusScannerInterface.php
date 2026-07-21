<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Services;

use Stackra\Storage\Models\File;
use Stackra\Storage\Services\NullAntivirusScanner;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the antivirus scanner.
 *
 * The default {@see NullAntivirusScanner} reports `clean` on every
 * scan — safe for local dev. Consumer apps bind a real scanner
 * (ClamAV, external SaaS scanner) with
 * `#[Overrides(AntivirusScannerInterface::class)]` on their own
 * concrete (Pattern B per `.kiro/steering/php-attributes.md`).
 *
 * `#[Bind(NullAntivirusScanner::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the null concrete stays free of the
 * binding attribute and only carries its lifetime attribute
 * (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(NullAntivirusScanner::class)]
interface AntivirusScannerInterface
{
    /**
     * Scan a File's bytes for known threats.
     *
     * @param  File  $file  The file to scan.
     * @return array{status: string, details: array<string, mixed>|null}
     *         `status` is the backing value of
     *         {@see \Stackra\Storage\Enums\VirusScanState};
     *         `details` is an optional JSON blob the caller writes
     *         to `virus_scan_details`.
     */
    public function scan(File $file): array;
}
