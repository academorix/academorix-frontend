<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Data\FileVariantData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\File;
use Academorix\Storage\Models\FileVariant;
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
