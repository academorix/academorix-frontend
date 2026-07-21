<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an import row is missing the required
 * `consent_evidence` column. Renders as HTTP 422.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterConsentEvidenceMissingException extends Exception
{
    public const CODE = 'newsletter.consent_evidence_missing';

    public const TRANSLATION_KEY = 'newsletter::errors.consent_evidence_missing';
}
