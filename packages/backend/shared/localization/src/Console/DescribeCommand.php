<?php

declare(strict_types=1);

namespace Stackra\Localization\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;

/**
 * `php artisan localization:describe {key}` — print the resolution
 * trace for one translation key.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:describe',
    description: 'Print the resolution trace for a translation key.',
)]
final class DescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:describe
        {key : Translation key (e.g. `messages.welcome`)}
        {--tenant= : Tenant id to scope by}
        {--locale=en : BCP-47 locale to describe}';

    public function handle(TranslationRepositoryInterface $translations): int
    {
        $key      = (string) $this->argument('key');
        $tenantId = $this->option('tenant');
        $locale   = (string) $this->option('locale');

        $this->omni->titleBar(\sprintf('Describe: %s (%s)', $key, $locale), 'purple');

        // Parse Laravel key shape: `namespace::group.item` or `group.item`.
        [$namespace, $rest] = \str_contains($key, '::')
            ? \explode('::', $key, 2)
            : ['*', $key];

        [$group, $item] = \str_contains($rest, '.')
            ? \explode('.', $rest, 2)
            : [$rest, ''];

        // Tier 1 — tenant override.
        $tenantRow = null;
        if (\is_string($tenantId) && $tenantId !== '' && $item !== '') {
            $tenantRow = $translations->findResolved(
                $tenantId,
                $locale,
                $namespace,
                $group,
                $item,
            );
        }

        // Tier 2 — platform default.
        $platformRow = null;
        if ($item !== '') {
            $platformRow = $translations->findResolved(
                null,
                $locale,
                $namespace,
                $group,
                $item,
            );
        }

        $this->omni->tableHeader('Tier', 'Present', 'Value');
        $this->omni->tableRow(
            'DB tenant override',
            $tenantRow !== null ? 'yes' : 'no',
            $tenantRow?->{'value'} ?? '—',
        );
        $this->omni->tableRow(
            'DB platform default',
            $platformRow !== null ? 'yes' : 'no',
            $platformRow?->{'value'} ?? '—',
        );
        $this->omni->tableRow(
            'File lookup',
            'deferred (runtime only)',
            '—',
        );

        $this->omni->success('Describe complete.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
