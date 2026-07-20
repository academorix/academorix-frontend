<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Enums;

/**
 * Wire-visible backed enum for `report-run.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
enum ReportRunStatus: string
{
    case Queued = 'queued';
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
}
