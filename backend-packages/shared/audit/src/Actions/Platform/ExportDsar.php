<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Platform;

use Academorix\Audit\Data\Requests\ExportDsarRequestData;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Jobs\ExportAuditForDsarJob;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/platform/audits/export-dsar` — dispatch a DSAR
 * export job for a single subject across a date window.
 *
 * DSAR requests are async by contract — the bundle is produced by
 * {@see ExportAuditForDsarJob} on the `compliance` queue and lands
 * via the storage module's signed URL surface. This action returns
 * `202 Accepted` with the dispatch acknowledgement; the operator
 * checks the storage-module notifications inbox for the ready
 * signal.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.platform.export_dsar')]
#[Post('/api/v1/platform/audits/export-dsar')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(AuditPermission::ExportDsar)]
final class ExportDsar
{
    use AsController;

    public function __invoke(ExportDsarRequestData $data): JsonResponse
    {
        ExportAuditForDsarJob::dispatch(
            $data->userId,
            $data->from,
            $data->to,
            $data->format,
        );

        return response()->json([
            'status'  => 'dispatched',
            'user_id' => $data->userId,
            'from'    => $data->from,
            'to'      => $data->to,
            'format'  => $data->format,
        ], JsonResponse::HTTP_ACCEPTED);
    }
}
