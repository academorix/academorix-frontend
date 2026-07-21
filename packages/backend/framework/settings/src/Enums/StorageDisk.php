<?php

declare(strict_types=1);

/**
 * Storage Disk Enumeration
 *
 * Defines the set of allowed values for Storage Disk within the Settings module.
 * Supported values include: Local, Public, S3.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Stackra\Settings\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

/**
 * Storage Disk Enum.
 *
 * Supported local storage disks for file operations.
 *
 * @method static LOCAL()  Returns the LOCAL enum instance
 * @method static PUBLIC() Returns the PUBLIC enum instance
 * @method static S3()     Returns the S3 enum instance
 *
 * @since 1.0.0
 */
enum StorageDisk: string
{
    use Enum;

    /**
     * Local private storage disk.
     */
    #[Label('Local')]
    #[Description('Local private storage disk. Files are not publicly accessible.')]
    case Local = 'local';

    /**
     * Public storage disk with web-accessible files.
     */
    #[Label('Public')]
    #[Description('Public storage disk. Files are accessible via the web.')]
    case Public = 'public';

    /**
     * Amazon S3 compatible storage disk.
     */
    #[Label('S3')]
    #[Description('Amazon S3 compatible storage disk for cloud file storage.')]
    case S3 = 's3';
}
