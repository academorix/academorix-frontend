<?php

declare(strict_types=1);

/**
 * Cloud Disk Enumeration
 *
 * Defines the set of allowed values for Cloud Disk within the Settings module.
 * Supported values include: S3, Gcs, Azure.
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
 * Cloud Disk Enum.
 *
 * Supported cloud storage providers for remote file operations.
 *
 * @method static S3()    Returns the S3 enum instance
 * @method static GCS()   Returns the GCS enum instance
 * @method static AZURE() Returns the AZURE enum instance
 *
 * @since 1.0.0
 */
enum CloudDisk: string
{
    use Enum;

    /**
     * Amazon S3 cloud storage.
     */
    #[Label('Amazon S3')]
    #[Description('Amazon Simple Storage Service (S3) cloud storage provider.')]
    case S3 = 's3';

    /**
     * Google Cloud Storage.
     */
    #[Label('Google Cloud Storage')]
    #[Description('Google Cloud Storage (GCS) cloud storage provider.')]
    case Gcs = 'gcs';

    /**
     * Microsoft Azure Blob Storage.
     */
    #[Label('Azure Blob Storage')]
    #[Description('Microsoft Azure Blob Storage cloud storage provider.')]
    case Azure = 'azure';
}
