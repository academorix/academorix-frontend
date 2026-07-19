<?php

declare(strict_types=1);

namespace Academorix\Settings\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Settings\Contracts\Services\SettingsResolverInterface;

/**
 * `php artisan settings:show {key} {--scope=} {--scope-id=}` —
 * resolve + print a single setting value.
 *
 * When `--scope` is omitted the resolver walks user → tenant → system
 * with `--scope-id` treated as either a user or tenant id depending on
 * `--scope`.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'settings:show',
    description: 'Resolve + print a single setting value.',
)]
final class SettingsShowCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'settings:show
        {key : The field slug to resolve}
        {--scope= : One of system / tenant / user}
        {--scope-id= : Concrete owner id — tenant id for tenant, user id for user}';

    public function handle(SettingsResolverInterface $resolver): int
    {
        $this->omni->titleBar('Resolve Setting', 'indigo');

        $key      = (string) $this->argument('key');
        $scope    = (string) ($this->option('scope') ?? '');
        $scopeId  = (string) ($this->option('scope-id') ?? '');

        $tenantId = null;
        $userId   = null;

        if ($scope === 'tenant' && $scopeId !== '') {
            $tenantId = $scopeId;
        } elseif ($scope === 'user' && $scopeId !== '') {
            $userId = $scopeId;
        }

        $value = $resolver->resolve($key, $tenantId, $userId);

        $this->omni->dataList(
            [
                'key'       => $key,
                'scope'     => $scope !== '' ? $scope : 'system',
                'scope_id'  => $scopeId !== '' ? $scopeId : '(null)',
                'value'     => \json_encode($value, JSON_UNESCAPED_UNICODE),
            ],
            title: 'Resolved',
        );

        $this->showDuration();

        return self::SUCCESS;
    }
}
