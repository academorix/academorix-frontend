<?php

declare(strict_types=1);

namespace Stackra\Compliance\Attributes;

use Attribute;

/**
 * Register a model class as a DSAR-export contributor.
 *
 * The build-time compiler discovers `#[DsarExportable]`-marked
 * classes via `Stackra\Foundation\Contracts\DiscoversAttributes`
 * and hands them to the
 * {@see \Stackra\Compliance\Services\DefaultDsarContributorRegistry},
 * which stores each contributor's subject column, include / exclude
 * glob, and priority so the assembler can walk them in the right
 * order.
 *
 * ```php
 * #[DsarExportable(
 *     subject: 'owner_id',
 *     exclude: ['password_hash', 'mfa_secret', 'remember_token'],
 *     format: 'json',
 * )]
 * final class User extends Model
 * {
 * }
 * ```
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class DsarExportable
{
    /**
     * @param  string       $subject       Column pointing at the subject id (e.g. `owner_id`).
     * @param  string|null  $subjectType   Column name for the morph type when the subject is polymorphic.
     * @param  list<string> $include       Column glob to export. `['*']` = all.
     * @param  list<string> $exclude       Columns to redact from the export.
     * @param  string       $format        Wire format: `json` / `csv` / `ndjson`.
     * @param  int          $chunkSize     Rows per streaming chunk.
     * @param  int          $priority      Assembly order; lower runs first.
     */
    public function __construct(
        public string $subject,
        public ?string $subjectType = null,
        public array $include = ['*'],
        public array $exclude = [],
        public string $format = 'json',
        public int $chunkSize = 1000,
        public int $priority = 100,
    ) {
    }
}
