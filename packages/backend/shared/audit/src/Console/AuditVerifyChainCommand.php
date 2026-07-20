<?php

declare(strict_types=1);

namespace Academorix\Audit\Console;

use Academorix\Audit\Jobs\VerifyAuditChainJob;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;

/**
 * `php artisan audit:verify-chain` — dispatch
 * {@see VerifyAuditChainJob}.
 *
 * ## Usage
 *
 * ```
 * # Whole platform:
 * php artisan audit:verify-chain
 *
 * # Single tenant:
 * php artisan audit:verify-chain --tenant=ten_01H...
 * ```
 *
 * The command dispatches to the queue and exits immediately —
 * results arrive via {@see \Academorix\Audit\Events\AuditChainVerified}
 * and {@see \Academorix\Audit\Events\AuditChainBroken}.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'audit:verify-chain',
    description: 'Dispatch VerifyAuditChainJob for one tenant or the whole platform.',
)]
final class AuditVerifyChainCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'audit:verify-chain
        {--tenant= : Optional tenant id (ten_...) to constrain the walk}';

    public function handle(): int
    {
        $this->omni->titleBar('Verify Audit Chain', 'sky');

        $tenantValue = $this->option('tenant');
        $tenantId    = (\is_string($tenantValue) && $tenantValue !== '') ? $tenantValue : null;

        VerifyAuditChainJob::dispatch($tenantId);

        $this->omni->success(\sprintf(
            'Dispatched VerifyAuditChainJob (%s).',
            $tenantId === null ? 'whole platform' : 'tenant=' . $tenantId,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
