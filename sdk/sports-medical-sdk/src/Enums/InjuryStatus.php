<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Enums;

/**
 * Wire-visible backed enum for `injury.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
enum InjuryStatus: string
{
    case Reported = 'reported';
    case UnderTreatment = 'under_treatment';
    case Recovering = 'recovering';
    case Cleared = 'cleared';
}
