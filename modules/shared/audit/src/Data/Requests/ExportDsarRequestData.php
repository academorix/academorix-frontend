<?php

declare(strict_types=1);

namespace Academorix\Audit\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Date;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/audits/export-dsar`.
 *
 * All three window fields are mandatory — a DSAR without a bounded
 * date window would surface every historic audit row referencing
 * the subject, which is unlikely to be what the requesting operator
 * asked for. The `format` field defaults to `json` — the most
 * portable output the receiving DPO tools can ingest.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ExportDsarRequestData extends Data
{
    /**
     * @param  string  $userId  Subject id — matched against
     *   `user_id` (actor) OR `auditable_id` (target) in either
     *   position on the audit row.
     * @param  string  $from    Window start (ISO 8601 date or
     *   datetime).
     * @param  string  $to      Window end (ISO 8601 date or datetime).
     * @param  string  $format  Output format for the produced bundle.
     *   Currently `json` and `csv` are supported.
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $userId,

        #[Required, Date]
        public string $from,

        #[Required, Date]
        public string $to,

        #[Required, In(['json', 'csv'])]
        public string $format = 'json',
    ) {
    }
}
