<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Enums;

/**
 * Wire-visible backed enum for `form-submission.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
enum FormSubmissionStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Abandoned = 'abandoned';
    case FailedValidation = 'failed_validation';
}
