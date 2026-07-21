<?php

declare(strict_types=1);

namespace Stackra\Transfer\Services;

use Stackra\Transfer\Contracts\Services\ExportManagerInterface;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of {@see ExportManagerInterface}.
 *
 * Ships so the module boots without a hard maatwebsite/excel wire-up.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullExportManager implements ExportManagerInterface
{
    /**
     * {@inheritDoc}
     */
    public function dispatch(XferJob $job): void
    {
        // No-op — no export engine bound. See NullImportManager for
        // the rationale.
    }

    /**
     * {@inheritDoc}
     */
    public function stream(XferJob $job): string
    {
        return \tempnam(\sys_get_temp_dir(), 'xfer_') ?: '';
    }

    /**
     * {@inheritDoc}
     */
    public function template(string $entityKey, string $format): string
    {
        return \tempnam(\sys_get_temp_dir(), 'xfer_tpl_') ?: '';
    }
}
