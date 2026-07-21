<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Enums;

/**
 * Wire-visible backed enum for `medication.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
enum MedicationStatus: string
{
    case Active = 'active';
    case Discontinued = 'discontinued';
    case Completed = 'completed';
    case OnHold = 'on_hold';
}
