<?php

/**
 * @file packages/exceptions/src/UnexpectedException.php
 *
 * @description
 * The mapper's fallback. Wraps any un-mapped `\Throwable` so the JSON
 * response is uniform; the original throwable is preserved as
 * `$previous` so Sentry / Ignition still see the real stack trace.
 *
 * ## Never throw this directly
 *
 * If your code is about to throw `UnexpectedException`, that's a
 * signal to add a specific subclass to
 * {@see \Stackra\Exceptions\RECOMMENDATIONS.md}. This class only
 * exists to give {@see \Stackra\Exceptions\Support\ExceptionMapper}
 * a target for the "we don't know what this is" bucket.
 *
 * ## Translation key
 *
 *   exceptions::generic.unexpected
 *
 * @see Exception  Base class.
 * @see \Stackra\Exceptions\Support\ExceptionMapper  The only legitimate producer of this class.
 */

declare(strict_types=1);

namespace Stackra\Exceptions;

use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class UnexpectedException extends Exception
{
    /**
     * Machine-readable code — matches the base class default so
     * clients that already special-case "unknown Stackra error"
     * work uniformly whether the exception was mapped or fell
     * through raw.
     */
    public const CODE = 'stackra.unexpected';

    /**
     * Class-level translation key pointing at
     * `lang/en/generic.php → unexpected`. The generic fallback
     * every renderer lands on when nothing more specific matches.
     */
    public const TRANSLATION_KEY = 'exceptions::generic.unexpected';

    /**
     * `Critical` severity — anything reaching this class is
     * unexpected traffic that ops needs to see. Never downgrade.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Critical;

    /**
     * `Unexpected` category — the dedicated bucket for
     * un-classified errors. Dashboards should chart this counter
     * with a low threshold — a spike means the mapper is missing a
     * case.
     */
    protected ErrorCategory $category = ErrorCategory::Unexpected;

    /**
     * 500 — the safe default for "we don't know what went wrong".
     * If the original throwable carried a specific status, prefer
     * mapping it to a more precise subclass rather than propagating
     * the status here.
     */
    protected int $httpStatus = Response::HTTP_INTERNAL_SERVER_ERROR;

    /**
     * Wrap any throwable in an `UnexpectedException`, preserving the
     * origin class name in context so dashboards can group by the
     * underlying type.
     *
     * The `$previous` chain is kept intact so Sentry / Ignition
     * still see the real stack trace — this class is a semantic
     * shell around the original, not a replacement.
     *
     * @param  Throwable  $original  The unmapped throwable to wrap.
     *                               Kept as `$previous` on the new
     *                               instance; its class name is
     *                               stored in `context.origin_class`
     *                               for dashboard grouping.
     * @return self The wrapped instance. Return type is `self` (not
     *              `static`) because this class is `final` and the
     *              factory would otherwise misrepresent
     *              subclass-ability.
     */
    public static function wrap(Throwable $original): self
    {
        return (new self($original->getMessage() ?: 'Unexpected error.', $original))
            ->withContext(['origin_class' => $original::class]);
    }
}
