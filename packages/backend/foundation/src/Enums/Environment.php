<?php

declare(strict_types=1);

/**
 * Environment Enumeration
 *
 * Defines the set of allowed values for Environment within the Foundation module.
 * Supported values include: TEST, STAGING, PRODUCTION, DEVELOPMENT.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Foundation\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/**
 * Enum representing different environment types.
 *
 * @method static TEST() Returns the TEST enum instance
 * @method static STAGING() Returns the STAGING enum instance
 * @method static PRODUCTION() Returns the PRODUCTION enum instance
 * @method static DEVELOPMENT() Returns the DEVELOPMENT enum instance
 * @method static LOCAL() Returns the LOCAL enum instance
 *
 * @enum {string}
 */
enum Environment: string
{
    use Enum;

    /**
     * Test environment.
     */
    #[Label('Test')]
    #[Description('Represents the test environment, used for running tests and ensuring the functionality before deployment.')]
    case TEST = 'test';

    /**
     * Staging environment.
     */
    #[Label('Staging')]
    #[Description('Represents the staging environment, used for pre-production testing and review.')]
    case STAGING = 'staging';

    /**
     * Production environment.
     */
    #[Label('Production')]
    #[Description('Represents the production environment, where the application is live and accessible to end users.')]
    case PRODUCTION = 'production';

    /**
     * Development environment.
     */
    #[Label('Development')]
    #[Description('Represents the development environment, where new features and updates are developed and tested.')]
    case DEVELOPMENT = 'development';

    /**
     * Development environment.
     */
    #[Label('Local')]
    #[Description('Represents the local environment, where new features and updates are developed and tested.')]
    case LOCAL = 'local';
}
