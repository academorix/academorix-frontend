<?php

declare(strict_types=1);

namespace Academorix\Audit\Console;

use Academorix\Audit\Jobs\ExportAuditForDsarJob;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;

/**
 * `php artisan audit:export-dsar {user}` — dispatch
 * {@see ExportAuditForDsarJob} for one subject.
 *
 * ## Usage
 *
 * ```
 * php artisan audit:export-dsar usr_01H... --from=2024-01-01 --to=2024-12-31 --format=json
 * ```
 *
 * The bundle is produced by the storage module out-of-band; this
 * command only dispatches. Ops picks up the ready signal from the
 * storage module's notifications inbox.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'audit:export-dsar',
    description: 'Dispatch ExportAuditForDsarJob for one subject across a date window.',
)]
final class AuditExportDsarCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'audit:export-dsar
        {user : Subject id (matched against user_id AND auditable_id)}
        {--from= : Window start (ISO 8601; defaults to 30 days ago)}
        {--to= : Window end (ISO 8601; defaults to now)}
        {--format=json : Output format (json | csv)}';

    public function handle(): int
    {
        $this->omni->titleBar('Export Audit for DSAR', 'sky');

        $userId = (string) $this->argument('user');

        $fromOpt = $this->option('from');
        $toOpt   = $this->option('to');
        $formatOpt = $this->option('format');

        $from   = (\is_string($fromOpt) && $fromOpt !== '')
            ? $fromOpt
            : \now()->subDays(30)->toIso8601String();
        $to     = (\is_string($toOpt) && $toOpt !== '')
            ? $toOpt
            : \now()->toIso8601String();
        $format = (\is_string($formatOpt) && $formatOpt !== '') ? $formatOpt : 'json';

        ExportAuditForDsarJob::dispatch($userId, $from, $to, $format);

        $this->omni->success(\sprintf(
            'Dispatched ExportAuditForDsarJob (subject=%s, window=%s..%s, format=%s).',
            $userId,
            $from,
            $to,
            $format,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
