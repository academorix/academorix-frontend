<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a write is attempted on an archived newsletter.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterArchivedException extends AcademorixException
{
    public const CODE = 'newsletter.archived';

    public const TRANSLATION_KEY = 'newsletter::errors.archived';
}
