<?php

declare(strict_types=1);

namespace Academorix\Localization\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Data\TenantLocaleInterface;
use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Contracts\Repositories\TenantLocaleRepositoryInterface;

/**
 * `php artisan localization:list-locales` — list platform-active
 * locales, or the enabled locales for one tenant with `--tenant=`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:list-locales',
    description: 'List platform-active locales, or tenant-enabled locales with --tenant=.',
)]
final class ListLocalesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:list-locales
        {--tenant= : Optional tenant id — list that tenant\'s enabled locales instead}
        {--enabled-only : When passed with --tenant, filter to is_active=true}';

    public function handle(
        PlatformLanguageRepositoryInterface $languages,
        TenantLocaleRepositoryInterface $tenantLocales,
    ): int {
        $tenantId = $this->option('tenant');

        if (\is_string($tenantId) && $tenantId !== '') {
            $this->omni->titleBar(\sprintf('Locales for tenant "%s"', $tenantId), 'emerald');

            $enabledOnly = (bool) $this->option('enabled-only');
            $rows        = $tenantLocales->findByTenant($tenantId);

            if ($enabledOnly) {
                $rows = $rows->where(TenantLocaleInterface::ATTR_IS_ACTIVE, true)->values();
            }

            if ($rows->isEmpty()) {
                $this->omni->info('No locales enabled for this tenant.');
                $this->showDuration();

                return self::SUCCESS;
            }

            $this->omni->tableHeader('Language id', 'Default', 'Fallback', 'Active', 'Driver');
            foreach ($rows as $row) {
                $this->omni->tableRow(
                    (string) $row->{TenantLocaleInterface::ATTR_LANGUAGE_ID},
                    ((bool) $row->{TenantLocaleInterface::ATTR_IS_DEFAULT}) ? 'yes' : 'no',
                    ((bool) $row->{TenantLocaleInterface::ATTR_IS_FALLBACK}) ? 'yes' : 'no',
                    ((bool) $row->{TenantLocaleInterface::ATTR_IS_ACTIVE}) ? 'yes' : 'no',
                    (string) ($row->{TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER}?->value ?? '—'),
                );
            }

            $this->omni->success(\sprintf('%d locale(s) enabled.', $rows->count()));
            $this->showDuration();

            return self::SUCCESS;
        }

        // Platform catalogue view.
        $this->omni->titleBar('Platform Language Catalogue', 'sky');

        $catalogue = $languages->findAllActive();
        if ($catalogue->isEmpty()) {
            $this->omni->info('No active platform languages. Run `localization:seed-platform-languages` to populate.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('BCP-47', 'Name', 'Script', 'Direction', 'Beta');
        foreach ($catalogue as $row) {
            $this->omni->tableRow(
                (string) $row->{PlatformLanguageInterface::ATTR_BCP47_CODE},
                (string) ($row->name ?? '—'),
                (string) ($row->{PlatformLanguageInterface::ATTR_SCRIPT} ?? '—'),
                $row->direction->value,
                ((bool) $row->{PlatformLanguageInterface::ATTR_IS_BETA}) ? 'yes' : 'no',
            );
        }

        $this->omni->success(\sprintf('%d language(s) active.', $catalogue->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
