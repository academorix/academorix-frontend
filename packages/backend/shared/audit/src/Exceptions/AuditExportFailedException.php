<?php

declare(strict_types=1);

namespace Stackra\Audit\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a DSAR export job cannot produce a bundle.
 *
 * Terminal error surfaces:
 *   - Cold-storage read failure (S3 Glacier restore timeout).
 *   - Signing key rotation mid-run.
 *   - Storage module rejected the produced bundle upload.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditExportFailedException extends Exception
{
    public const CODE = 'audit.export_failed';

    public const TRANSLATION_KEY = 'audit::errors.export_failed';
}
