<?php

/**
 * @file packages/compliance/retention/src/Console/RunRetentionCommand.php
 *
 * @description
 * `compliance:retention:run` — the scheduled artisan command that
 * walks every registered
 * {@see \Stackra\Retention\Support\RetentionPolicyDescriptor},
 * dispatches each to the
 * {@see \Stackra\Retention\Runner\RetentionRunner}, and
 * renders a one-row-per-policy summary to the terminal.
 *
 * ## Scheduling
 *
 * Attribute-scheduled at 03:00 daily by default via
 * `#[Cron('0 3 * * *')]`. Ops can override the cadence via the
 * `retention.schedule.cron` config once the scheduling package
 * exposes config-driven overrides (today the attribute value is
 * authoritative). Global disable via
 * `retention.schedule.enabled=false` (env
 * `RETENTION_SCHEDULE_ENABLED`) — the runner still ships and
 * exposes the command for ad-hoc `--dry-run` inspection even
 * when the scheduler is off.
 *
 * ## Options
 *
 *  * `--key=` — restrict the run to a single policy by identifier
 *    (`ai.run`, `notification.digest`, ...). Unknown keys return
 *    HTTP-style FAILURE with an error message.
 *  * `--dry-run` — replace destructive `->delete()` calls with
 *    `->count()` on every policy so operators can preview the
 *    blast radius before flipping the switch. `Archive` and
 *    `Anonymize` branches are always no-ops in v1 (see the
 *    runner's docblock).
 */

declare(strict_types=1);

namespace Stackra\Retention\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Retention\Enums\RetentionAction;
use Stackra\Retention\Registry\RetentionPolicyRegistry;
use Stackra\Retention\Runner\RetentionRunner;
use Stackra\Retention\Support\RetentionPolicyDescriptor;
use Stackra\Scheduling\Attributes\Cron;
use Stackra\Scheduling\Attributes\OnOneServer;
use Stackra\Scheduling\Attributes\ScheduleName;
use Stackra\Scheduling\Attributes\WithoutOverlapping;
use Illuminate\Container\Attributes\Singleton;

/**
 * Scheduled retention-scanner entry point.
 *
 * ## What this class owns
 *
 *  * The `--key` filter that narrows execution to a single
 *    descriptor.
 *  * The `--dry-run` flag propagated to every runner invocation.
 *  * The OmniTerm output — title bar, header row, one status
 *    row per policy (success / warning / error), completion
 *    duration.
 *
 * `#[Singleton]` — the command is stateless once the container
 * hydrates its dependencies. Symfony Console instantiates once
 * per invocation regardless, but the singleton hint keeps the
 * shape consistent with other scheduled commands in the monorepo.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[Singleton]
#[AsCommand(
    name: 'compliance:retention:run',
    description: 'Scan every registered retention policy and apply its action (delete / archive / anonymize).',
)]
#[Cron('0 3 * * *')]
#[WithoutOverlapping]
#[OnOneServer]
#[ScheduleName('compliance.retention')]
final class RunRetentionCommand extends BaseCommand
{
    /**
     * Command signature — Laravel's console kernel reads the
     * command NAME from this property. The {@see AsCommand}
     * attribute carries the human description separately.
     *
     * @var string
     */
    protected $signature = 'compliance:retention:run
        {--key= : Restrict to a single policy key (e.g. ai.run)}
        {--dry-run : Preview affected row counts without deleting}';

    /**
     * Execute the console command.
     *
     * @param  RetentionPolicyRegistry  $registry  Registry hydrated by the discovery bootstrapper.
     * @param  RetentionRunner  $runner  Per-descriptor executor.
     */
    public function handle(
        RetentionPolicyRegistry $registry,
        RetentionRunner $runner,
    ): int {
        $this->omni->titleBar('Retention Scanner', 'sky');

        $keyOption = $this->option('key');
        $keyFilter = \is_string($keyOption) && $keyOption !== '' ? $keyOption : null;
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->omni->warning('DRY RUN — no rows will be deleted.');
        }

        /** @var list<RetentionPolicyDescriptor> $descriptors */
        $descriptors = $this->filterDescriptors($registry, $keyFilter);

        if ($descriptors === []) {
            if ($keyFilter !== null) {
                $this->error(\sprintf(
                    'No retention policy registered under key "%s". Run without --key to list every registered policy.',
                    $keyFilter,
                ));

                return self::FAILURE;
            }

            $this->omni->info('No retention policies registered.');
            $this->showDuration();

            return self::SUCCESS;
        }

        // Header — three columns fit the shipped OmniTerm helper;
        // the model + action + duration collapse into the details
        // column so operators still see every meaningful field on
        // a single row.
        $this->omni->tableHeader('Policy', 'Rows', 'Model / Action / Duration');

        foreach ($descriptors as $descriptor) {
            $report = $runner->run($descriptor, $dryRun);

            $details = \sprintf(
                '%s · %s · %dms',
                $descriptor->modelClass,
                $descriptor->action->value,
                $report->durationMs,
            );

            $rowLabel = $descriptor->key;
            $rowValue = (string) $report->rowsAffected;

            if ($report->errorMessage !== null) {
                if ($descriptor->action === RetentionAction::Delete) {
                    // Delete branch failed — the throw path.
                    $this->omni->tableRowError(
                        $rowLabel,
                        \sprintf('%s — %s (%s)', $rowValue, $details, $report->errorMessage),
                    );
                } else {
                    // Archive / Anonymize deferrals — visible but
                    // non-fatal — surface as a warning.
                    $this->omni->tableRowWarning(
                        $rowLabel,
                        \sprintf('%s — %s (%s)', $rowValue, $details, $report->errorMessage),
                    );
                }

                continue;
            }

            $this->omni->tableRowSuccess(
                $rowLabel,
                \sprintf('%s — %s', $rowValue, $details),
            );
        }

        $this->showDuration();

        return self::SUCCESS;
    }

    /**
     * Filter the registry to either every descriptor or a
     * specific-key subset.
     *
     * Reads {@see RetentionPolicyRegistry::descriptors()} which
     * returns descriptors in priority-ASC order (ties broken by
     * insertion cursor) — the terminal output mirrors the exact
     * order the runner would apply the policies.
     *
     * @param  string|null  $keyFilter  Non-null narrows to a single key; null returns every descriptor.
     * @return list<RetentionPolicyDescriptor>
     */
    private function filterDescriptors(
        RetentionPolicyRegistry $registry,
        ?string $keyFilter,
    ): array {
        if ($keyFilter !== null) {
            $descriptor = $registry->find($keyFilter);

            return $descriptor === null ? [] : [$descriptor];
        }

        return $registry->descriptors();
    }
}
