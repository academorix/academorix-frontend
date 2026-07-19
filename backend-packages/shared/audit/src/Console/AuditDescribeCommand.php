<?php

declare(strict_types=1);

namespace Academorix\Audit\Console;

use Academorix\Audit\Contracts\Services\AuditRegistryInterface;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;

/**
 * `php artisan audit:describe` — render the {@see AuditRegistryInterface}
 * contents as a table.
 *
 * Ops uses this to answer "which classes are audit-eligible + which
 * of their fields get KMS-encrypted?" without having to grep every
 * package for the `#[Auditable]` attribute.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'audit:describe',
    description: 'Render the audit registry (auditable classes + encrypted fields).',
)]
final class AuditDescribeCommand extends BaseCommand
{
    public function handle(AuditRegistryInterface $registry): int
    {
        $this->omni->titleBar('Audit Registry', 'sky');

        $entries = $registry->all();

        if ($entries === []) {
            $this->omni->info('No classes carry #[Auditable]. Nothing to describe.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Class', 'Encrypted Fields');

        foreach ($entries as $className => $fields) {
            $this->omni->tableRow(
                $className,
                $fields === [] ? '(none)' : \implode(', ', $fields),
            );
        }

        $this->omni->success(\sprintf('Registered %d auditable class(es).', \count($entries)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
