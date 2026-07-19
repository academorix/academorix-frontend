<?php

declare(strict_types=1);

namespace Academorix\Transfer\Services;

use Academorix\Transfer\Contracts\Services\ImportManagerInterface;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of {@see ImportManagerInterface}.
 *
 * Ships so the module boots without a hard maatwebsite/excel wire-up.
 * Consumer apps override by binding a real orchestrator
 * (`MaatwebsiteImportManager`) through the interface's `#[Bind]`
 * attribute.
 *
 * `#[Singleton]` — the manager is stateless; the container reuses
 * the same instance for every dispatch in the worker process.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullImportManager implements ImportManagerInterface
{
    /**
     * {@inheritDoc}
     */
    public function dispatch(XferJob $job): void
    {
        // No-op — no import engine bound. The default provider is
        // safe to ship because the tenant surface is gated by the
        // module's kill switch (`config('transfer.imports_enabled')`).
    }

    /**
     * {@inheritDoc}
     */
    public function runSync(XferJob $job): array
    {
        return [
            'counters' => ['total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0, 'deleted' => 0],
            'errors'   => [],
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function preview(string $entityKey, string $sourcePath, int $rows = 10): array
    {
        return [
            'headers'           => [],
            'rows'              => [],
            'suggested_mapping' => [],
        ];
    }
}
