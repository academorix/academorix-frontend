<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Services;

use Stackra\Transfer\Models\XferJob;
use Stackra\Transfer\Services\NullImportManager;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the import orchestrator.
 *
 * The default {@see NullImportManager} constructs the maatwebsite/excel
 * `AbstractDynamicImport` for a job and drives Laravel Excel's
 * `->queue()` chain. Consumer apps override by binding a custom
 * concrete class through this interface's `#[Bind]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(NullImportManager::class)]
interface ImportManagerInterface
{
    /**
     * Dispatch a queued import for the given `XferJob`.
     *
     * @param  XferJob  $job  Persisted, status = `queued`.
     */
    public function dispatch(XferJob $job): void;

    /**
     * Run the import synchronously (CLI + tests).
     *
     * @return array{counters: array<string, int>, errors: list<array<string, mixed>>}
     */
    public function runSync(XferJob $job): array;

    /**
     * Preview the first N rows of a source file without persisting.
     *
     * @return array{headers: list<string>, rows: list<array<string, mixed>>, suggested_mapping: array<string, string>}
     */
    public function preview(string $entityKey, string $sourcePath, int $rows = 10): array;
}
