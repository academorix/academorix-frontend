<?php

declare(strict_types=1);

namespace Academorix\Storage\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Models\File;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Refuse READS on files whose `virus_scan_state` is not `clean`.
 *
 * Applied on read-facing routes only — the upload path enforces
 * quarantine via the observer + jobs, not via HTTP middleware.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'storage.antivirus.gate', groups: [], priority: 70)]
final class StorageAntivirusGate
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $fileId = (string) $request->route('file', '');
        if ($fileId === '') {
            return $next($request);
        }

        /** @var File|null $file */
        $file = File::query()->find($fileId);
        if ($file === null) {
            return $next($request);
        }

        $state = $file->{FileInterface::ATTR_VIRUS_SCAN_STATE};
        if ($state === VirusScanState::Clean) {
            return $next($request);
        }

        return new JsonResponse([
            'message' => __('storage::errors.quarantined'),
            'code'    => 'storage.quarantined',
            'context' => ['file_id' => $fileId, 'state' => $state instanceof VirusScanState ? $state->value : (string) $state],
        ], 403);
    }
}
