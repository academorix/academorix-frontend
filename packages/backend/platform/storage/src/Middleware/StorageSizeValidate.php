<?php

declare(strict_types=1);

namespace Stackra\Storage\Middleware;

use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Storage\Contracts\Registries\FileKindRegistryInterface;
use Stackra\Storage\Enums\FileKind;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Refuse uploads whose declared size exceeds the target kind's
 * max.
 *
 * Runs after `storage.mime.validate` — checks the size before we
 * bother buffering the whole file.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'storage.size.validate', groups: [], priority: 60)]
final class StorageSizeValidate
{
    public function __construct(
        private readonly FileKindRegistryInterface $registry,
    ) {
    }

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $file = $request->file('file');
        $kind = (string) $request->input('kind', '');

        if ($file === null || $kind === '' || \is_array($file)) {
            return $next($request);
        }

        $config = $this->registry->get($kind);
        $maxMb  = (int) ($config['maxSizeMb'] ?? (FileKind::tryFrom($kind)?->defaultMaxSizeMb() ?? 0));

        if ($maxMb <= 0) {
            return $next($request);
        }

        $sizeBytes = (int) $file->getSize();

        if ($sizeBytes > $maxMb * 1024 * 1024) {
            return new JsonResponse([
                'message' => __('storage::errors.size_exceeded'),
                'code'    => 'storage.size_exceeded',
                'context' => ['size_bytes' => $sizeBytes, 'max_mb' => $maxMb, 'kind' => $kind],
            ], 422);
        }

        return $next($request);
    }
}
