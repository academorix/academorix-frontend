<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Platform;

use Academorix\Audit\Data\Requests\VerifyChainRequestData;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Jobs\VerifyAuditChainJob;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/platform/audits/verify-chain` — dispatch a chain
 * verification job for one tenant or the whole platform.
 *
 * The action never performs the verification synchronously — chains
 * can be arbitrarily long and the caller does not want to hold a
 * request open for minutes. The response carries the job's dispatch
 * status; results arrive as
 * {@see \Academorix\Audit\Events\AuditChainVerified} +
 * {@see \Academorix\Audit\Events\AuditChainBroken} on the notifications
 * pipeline.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.platform.verify_chain')]
#[Post('/api/v1/platform/audits/verify-chain')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(AuditPermission::VerifyChain)]
final class VerifyChain
{
    use AsController;

    public function __invoke(VerifyChainRequestData $data): JsonResponse
    {
        VerifyAuditChainJob::dispatch($data->tenantId);

        return response()->json([
            'status'    => 'dispatched',
            'tenant_id' => $data->tenantId,
        ], JsonResponse::HTTP_ACCEPTED);
    }
}
