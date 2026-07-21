<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Stackra\Storage\Data\ChunkedUploadData;
use Stackra\Storage\Data\Requests\UploadChunkRequestData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\ChunkedUpload;
use Illuminate\Http\Request;

/**
 * `PATCH /api/v1/files/chunked/{upload}` — receive one chunk.
 *
 * Chunk bytes arrive in the request body. Header-carried `index`
 * + `sha256` land on the ledger via {@see UploadChunkRequestData}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.chunked.upload')]
#[Patch('/api/v1/files/chunked/{upload}')]
#[Middleware([
    'api',
    'resolve.tenant',
    'auth:sanctum',
    'tenant.user',
    'storage.size.validate',
    'storage.tenant.scope',
])]
#[RequirePermission(StoragePermission::Upload)]
final class UploadChunk
{
    use AsController;

    public function __construct(
        private readonly ChunkedUploadCoordinatorInterface $coordinator,
    ) {
    }

    public function __invoke(
        ChunkedUpload $upload,
        UploadChunkRequestData $data,
        Request $request,
    ): ChunkedUploadData {
        // Bytes arrive on the raw request body. Wrap in a temp
        // stream so the coordinator can process it uniformly.
        $stream = \fopen('php://temp', 'w+b');
        if ($stream === false) {
            throw new \RuntimeException('Unable to open temp stream for chunk upload.');
        }
        \fwrite($stream, $request->getContent());
        \rewind($stream);

        $updated = $this->coordinator->receiveChunk($upload, $data->index, $stream, $data->sha256);

        if (\is_resource($stream)) {
            \fclose($stream);
        }

        return ChunkedUploadData::fromModel($updated);
    }
}
