<?php

declare(strict_types=1);

namespace Academorix\Localization\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Contracts\Repositories\TranslationJobRepositoryInterface;
use Academorix\Localization\Enums\TranslationJobKind;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Enums\TranslatorDriverName;
use Academorix\Localization\Jobs\BulkTranslateNamespaceJob;

/**
 * `php artisan localization:bulk-translate` — dispatch a bulk
 * translation job for a tenant.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:bulk-translate',
    description: 'Dispatch a bulk translation job.',
)]
final class BulkTranslateCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:bulk-translate
        {tenant : Owning tenant id}
        {source : Source BCP-47 locale}
        {target : Target BCP-47 locale}
        {--namespace=* : Namespace filter}
        {--driver= : Driver override}
        {--dry-run : Preview without dispatching}';

    public function handle(TranslationJobRepositoryInterface $jobs): int
    {
        $tenantId = (string) $this->argument('tenant');
        $source   = (string) $this->argument('source');
        $target   = (string) $this->argument('target');
        $ns       = $this->option('namespace');
        $driver   = $this->option('driver');
        $dryRun   = (bool) $this->option('dry-run');

        $this->omni->titleBar('Bulk Translate', 'purple');

        if ($dryRun) {
            $this->omni->info(\sprintf(
                'Dry run — would dispatch bulk job for tenant %s (%s → %s).',
                $tenantId,
                $source,
                $target,
            ));
            $this->showDuration();

            return self::SUCCESS;
        }

        $namespace = \is_array($ns) && $ns !== [] ? (string) $ns[0] : '*';

        $job = $jobs->create([
            TranslationJobInterface::ATTR_TENANT_ID     => $tenantId,
            TranslationJobInterface::ATTR_KIND          => TranslationJobKind::Namespace,
            TranslationJobInterface::ATTR_DRIVER        => \is_string($driver) ? $driver : TranslatorDriverName::NullDriver->value,
            TranslationJobInterface::ATTR_SOURCE_LOCALE => $source,
            TranslationJobInterface::ATTR_TARGET_LOCALE => $target,
            TranslationJobInterface::ATTR_STATUS        => TranslationJobStatus::Queued,
        ]);

        BulkTranslateNamespaceJob::dispatch(
            translationJobId: (string) $job->getKey(),
            tenantId: $tenantId,
            sourceLocale: $source,
            targetLocale: $target,
            namespace: $namespace,
            group: null,
            driver: \is_string($driver) ? $driver : null,
        );

        $this->omni->success(\sprintf(
            'Dispatched bulk job "%s" for tenant %s (%s → %s).',
            (string) $job->getKey(),
            $tenantId,
            $source,
            $target,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
