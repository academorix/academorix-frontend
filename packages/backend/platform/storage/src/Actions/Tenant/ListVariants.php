<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Data\FileVariantData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\File;
use Stackra\Storage\Models\FileVariant;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/files/{file}/variants` — every variant for a file.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.tenant.variants.list')]
#[Get('/api/v1/files/{file}/variants')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'storage.tenant.scope'])]
#[RequirePermission(StoragePermission::ManageOwn)]
final class ListVariants
{
    use AsController;

    /**
     * @return DataCollection<int, FileVariantData>
     */
    public function __invoke(File $file): DataCollection
    {
        $rows = $file->variants()
            ->get()
            ->map(static fn (FileVariant $v): FileVariantData => FileVariantData::fromModel($v));

        return new DataCollection(FileVariantData::class, $rows);
    }
}
