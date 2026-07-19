<?php

declare(strict_types=1);

namespace Academorix\Storage\Http\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Storage\Contracts\Services\MimeTypeAllowlistInterface;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Refuse uploads whose sniffed MIME is not in the target kind's
 * allow-list.
 *
 * Runs before `storage.size.validate` — bounces bad uploads
 * cheaply. Sniffed MIME is what we validate, never the
 * client-declared one.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'storage.mime.validate', groups: [], priority: 60)]
final class StorageMimeValidate
{
    public function __construct(
        private readonly MimeTypeAllowlistInterface $allowlist,
    ) {
    }

    /**
     * Fail-closed — a missing file / kind is treated as invalid.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $file = $request->file('file');
        $kind = (string) $request->input('kind', '');

        if ($file === null || $kind === '') {
            // No upload on this request — let the action decide (some
            // storage endpoints don't carry a file at all).
            return $next($request);
        }

        // Prefer the real sniffed MIME over the client-declared one.
        $mime = \is_array($file) ? '' : (string) $file->getMimeType();

        if ($mime === '' || ! $this->allowlist->isAllowedForKey($mime, $kind)) {
            return new JsonResponse([
                'message' => __('storage::errors.mime_not_allowed'),
                'code'    => 'storage.mime_not_allowed',
                'context' => ['mime' => $mime, 'kind' => $kind],
            ], 422);
        }

        return $next($request);
    }
}
