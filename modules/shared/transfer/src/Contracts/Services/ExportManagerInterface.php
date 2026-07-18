<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Services;

use Academorix\Transfer\Models\XferJob;
use Academorix\Transfer\Services\NullExportManager;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the export orchestrator.
 *
 * The default {@see NullExportManager} constructs the maatwebsite/excel
 * `AbstractDynamicExport` for a job and drives Laravel Excel's
 * `->queue()` chain. Consumer apps override by binding a custom
 * concrete class through this interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(NullExportManager::class)]
interface ExportManagerInterface
{
    /**
     * Dispatch a queued export for the given `XferJob`.
     *
     * @param  XferJob  $job  Persisted, status = `queued`.
     */
    public function dispatch(XferJob $job): void;

    /**
     * Stream the export synchronously to the caller (small data sets).
     *
     * @return string  Absolute path to the generated file.
     */
    public function stream(XferJob $job): string;

    /**
     * Generate an empty template file for an entity.
     *
     * @return string  Absolute path to the generated template file.
     */
    public function template(string $entityKey, string $format): string;
}
