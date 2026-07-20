<?php

declare(strict_types=1);

/**
 * User Type Enumeration
 *
 * Defines the set of allowed values for User Type within the Foundation module.
 * Supported values include: USER, CUSTOMER, GUEST, ADMIN.
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
 * Enum representing user types.
 *
 * @method static USER() Returns the USER enum instance
 * @method static CUSTOMER() Returns the CUSTOMER enum instance
 * @method static GUEST() Returns the GUEST enum instance
 * @method static ADMIN() Returns the ADMIN enum instance
 */
enum UserType: string
{
    use Enum;

    /**
     * Represents a user.
     */
    #[Label('User')]
    #[Description('A general user with standard access.')]
    case USER = 'user';

    /**
     * Represents a customer.
     */
    #[Label('Customer')]
    #[Description('A customer with access related to purchasing or managing orders.')]
    case CUSTOMER = 'customer';

    /**
     * Represents a guest.
     */
    #[Label('Guest')]
    #[Description('A guest with limited access, typically without the ability to make purchases or access account-specific features.')]
    case GUEST = 'guest';

    /**
     * Represents an admin.
     */
    #[Label('Admin')]
    #[Description('An admin with full access to the system, including management of users, settings, and configurations.')]
    case ADMIN = 'admin';
}
