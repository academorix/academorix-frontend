<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Contracts\Services\AntivirusScannerInterface;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\File;
use Illuminate\Container\Attributes\Singleton;

/**
 * No-op scanner — reports every file as clean.
 *
 * The module boots without an antivirus dependency. Consumer apps
 * bind a real scanner (`ClamAvScanner`, `CloudScanScanner`) with
 * `#[Overrides(AntivirusScannerInterface::class)]` on their concrete
 * (Pattern B per `.kiro/steering/php-attributes.md`).
 *
 * `#[Singleton]` — the scan is stateless; the concrete carries only
 * its lifetime attribute. The interface declares the container
 * binding via `#[Bind(NullAntivirusScanner::class)]` (Pattern A).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullAntivirusScanner implements AntivirusScannerInterface
{
    /**
     * {@inheritDoc}
     */
    public function scan(File $file): array
    {
        return [
            'status'  => VirusScanState::Clean->value,
            'details' => null,
        ];
    }
}
