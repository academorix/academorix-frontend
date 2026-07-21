<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Enums;

/**
 * Wire-visible backed enum for `form-submission.handoff_status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
enum FormSubmissionHandoffStatus: string
{
    case NotApplicable = 'not_applicable';
    case Pending = 'pending';
    case Running = 'running';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
}
