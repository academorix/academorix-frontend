<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Data\ChunkedUploadData;
use Academorix\Storage\Data\Requests\UploadChunkRequestData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\ChunkedUpload;
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
