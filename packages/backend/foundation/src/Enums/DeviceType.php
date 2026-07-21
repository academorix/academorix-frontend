<?php

declare(strict_types=1);

/**
 * Device Type Enumeration
 *
 * Defines the set of allowed values for Device Type within the Foundation module.
 * Supported values include: MOBILE, TABLET, DESKTOP, UNKNOWN.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

/**
 * Enum representing different types of devices.
 *
 * @method static MOBILE() Returns the MOBILE enum instance
 * @method static TABLET() Returns the TABLET enum instance
 * @method static DESKTOP() Returns the DESKTOP enum instance
 * @method static UNKNOWN() Returns the UNKNOWN enum instance
 */
enum DeviceType: string
{
    use Enum;

    /**
     * Represents a mobile device.
     */
    #[Label('Mobile Device')]
    #[Description('Represents a mobile device.')]
    case MOBILE = 'mobile';

    /**
     * Represents a tablet device.
     */
    #[Label('Tablet Device')]
    #[Description('Represents a tablet device.')]
    case TABLET = 'tablet';

    /**
     * Represents a desktop device.
     */
    #[Label('Desktop Device')]
    #[Description('Represents a desktop device.')]
    case DESKTOP = 'desktop';

    /**
     * Represents an unknown device type.
     */
    #[Label('Unknown Device')]
    #[Description('Represents an unknown device type.')]
    case UNKNOWN = 'unknown';
}
