<?php

declare(strict_types=1);

namespace Stackra\Storage\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;

/**
 * `php artisan storage:signed-url-revoke-all` — emergency revoke
 * of every active signed URL. Optional tenant filter.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:signed-url-revoke-all',
    description: 'Revoke every active signed URL (optionally scoped to one tenant).',
)]
final class StorageSignedUrlRevokeAllCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:signed-url-revoke-all
        {--tenant= : Limit to one tenant id}
        {--reason=emergency_bulk_revoke : Free-form reason recorded on every audit row}';

    public function handle(SignedUrlAuditRepositoryInterface $audits): int
    {
        $this->omni->titleBar('Storage — Revoke All Signed URLs', 'rose');

        $reason = (string) ($this->option('reason') ?? 'emergency_bulk_revoke');
        $tenant = $this->option('tenant');
        $now    = \Carbon\CarbonImmutable::now();

        $q = $audits->query()
            ->withoutGlobalScopes()
            ->whereNull(SignedUrlAuditInterface::ATTR_REVOKED_AT);

        if (\is_string($tenant) && $tenant !== '') {
            $q->where(SignedUrlAuditInterface::ATTR_TENANT_ID, $tenant);
        }

        $count = $q->update([
            SignedUrlAuditInterface::ATTR_REVOKED_AT     => $now,
            SignedUrlAuditInterface::ATTR_REVOKED_REASON => $reason,
        ]);

        $this->omni->success(\sprintf('Revoked %d signed URL(s).', $count));
        $this->showDuration();

        return self::SUCCESS;
    }
}
