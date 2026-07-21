<?php

/**
 * @file packages/routing/src/Concerns/InteractsWithBulkOperations.php
 *
 * @description
 * Envelope helpers for bulk-modify endpoints. Every helper builds
 * on top of {@see InteractsWithResponse::response()} and attaches
 * a standardised `meta.operation` / `meta.count` block so
 * dashboards and audit logs can group / count operations without
 * per-endpoint parsing.
 *
 * ## Design
 *
 *   - **No `@method` PHPDoc.** Previously the trait documented
 *     `@method response()` to placate IDE stubs; that pattern
 *     caused phantom "trait method conflict" diagnostics. Trait
 *     composition alone is enough — the composing class must
 *     use {@see InteractsWithResponse} for `response()` to
 *     resolve at method dispatch.
 *
 *   - **Meta shape stable.** Every helper populates
 *     `meta.operation` (`bulk_create` / `bulk_update` /
 *     `bulk_delete` / `bulk_partial` / arbitrary custom string)
 *     and `meta.count`. Downstream observability keys off those
 *     labels.
 *
 * @see InteractsWithResponse   Provides `response()`.
 * @see \Stackra\Routing\Http\ResponseBuilder  Emitted by every helper.
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Stackra\Routing\Http\ResponseBuilder;

trait InteractsWithBulkOperations
{
    /**
     * 201 Created for bulk-create endpoints.
     *
     * @param  mixed        $data     List of created records (or the
     *                                collection of created ids). `count()`
     *                                is called when countable; otherwise
     *                                falls back to 1.
     * @param  string|null  $message  Envelope message; defaults to
     *                                "Items created successfully".
     */
    protected function bulkCreated(mixed $data, ?string $message = null): ResponseBuilder
    {
        $message ??= 'Items created successfully';

        return $this->response()
            ->created($data)
            ->message($message)
            ->meta([
                'operation' => 'bulk_create',
                'count' => $this->countOf($data),
            ]);
    }

    /**
     * 200 OK for bulk-update endpoints.
     *
     * Handles both call styles:
     *   - `$this->bulkUpdated(42)`               → count-only
     *     (integer arg). No `data` block emitted.
     *   - `$this->bulkUpdated([...records...])`  → count derived from
     *     the array and the records go in `data`.
     */
    protected function bulkUpdated(mixed $data, ?string $message = null): ResponseBuilder
    {
        $message ??= 'Items updated successfully';

        // Detect the "count only" call shape so callers who don't
        // want to return the mutated records can pass a raw int.
        $isCountOnly = is_int($data);
        $count = $isCountOnly ? $data : $this->countOf($data);

        return $this->response()
            ->ok($isCountOnly ? null : $data)
            ->message($message)
            ->meta([
                'operation' => 'bulk_update',
                'count' => $count,
            ]);
    }

    /**
     * 200 OK for bulk-delete endpoints. Body is intentionally
     * `null` — a deleted record has nothing to return.
     *
     * @param  int          $count    Number of records deleted.
     * @param  string|null  $message  Envelope message; defaults to
     *                                "Items deleted successfully".
     */
    protected function bulkDeleted(int $count, ?string $message = null): ResponseBuilder
    {
        $message ??= 'Items deleted successfully';

        return $this->response()
            ->ok(null)
            ->message($message)
            ->meta([
                'operation' => 'bulk_delete',
                'count' => $count,
            ]);
    }

    /**
     * Catch-all bulk helper — use for operations that don't fit
     * the create / update / delete triad (e.g. bulk_archive,
     * bulk_reassign, bulk_publish).
     *
     * @param  mixed        $data       Operation result payload.
     * @param  string       $operation  Stable label written to
     *                                  `meta.operation`. Convention:
     *                                  snake_case, prefixed with
     *                                  `bulk_`.
     * @param  string|null  $message    Envelope message.
     */
    protected function bulkOperation(
        mixed $data,
        string $operation,
        ?string $message = null,
    ): ResponseBuilder {
        $message ??= 'Bulk operation completed successfully';

        return $this->response()
            ->ok($data)
            ->message($message)
            ->meta([
                'operation' => $operation,
                'count' => $this->countOf($data),
            ]);
    }

    /**
     * Partial-success helper — some items succeeded, some failed.
     * Emits a single 200 with a structured body split into
     * `successful` and `failed` lists. `meta.operation` is set to
     * `bulk_partial`; `meta.*_count` fields carry the totals.
     *
     * @param  array<int, mixed>                    $successful
     * @param  array<int, mixed>                    $failed
     * @param  string|null                          $message
     */
    protected function bulkPartialSuccess(
        array $successful,
        array $failed,
        ?string $message = null,
    ): ResponseBuilder {
        $message ??= 'Bulk operation completed with some failures';

        return $this->response()
            ->ok([
                'successful' => $successful,
                'failed' => $failed,
            ])
            ->message($message)
            ->meta([
                'operation' => 'bulk_partial',
                'successful_count' => count($successful),
                'failed_count' => count($failed),
                'total_count' => count($successful) + count($failed),
            ]);
    }

    /**
     * Best-effort item-count of a mixed payload. Countable → count();
     * anything else → 1 (single-item semantics). Kept private so
     * the trait doesn't accidentally pollute the controller's
     * method surface.
     */
    private function countOf(mixed $data): int
    {
        if (is_countable($data)) {
            return count($data);
        }

        return 1;
    }
}
