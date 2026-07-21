<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Enums;

/**
 * Wire-visible backed enum for `injury.severity`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
enum InjurySeverity: string
{
    case Minor = 'minor';
    case Moderate = 'moderate';
    case Severe = 'severe';
    case Critical = 'critical';
}
