<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Services\ExportManagerInterface;
use Academorix\Transfer\Enums\TransferPermission;

/**
 * `GET /api/v1/transfer/templates/{entity}` — download an empty
 * template.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.templates.download')]
#[Get('/api/v1/transfer/templates/{entity}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::TemplatesDownload)]
final class DownloadTemplate
{
    use AsController;

    public function __construct(
        private readonly ExportManagerInterface $exporter,
    ) {
    }

    /**
     * @return array<string, string>
     */
    public function __invoke(string $entity): array
    {
        // MVP — return the resolved template path. A real impl
        // streams the file back through the response builder.
        return ['path' => $this->exporter->template($entity, 'xlsx')];
    }
}
