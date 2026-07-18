<?php

/**
 * @file packages/exceptions/src/Http/NotFoundException.php
 *
 * @description
 * HTTP 404 — the requested URL / resource does not exist. Generic
 * form; use {@see EntityNotFoundException} when the missing thing is
 * a specific Eloquent model instance so consumers see structured
 * `model` + `id` in context.
 *
 * ## Category
 *
 * `NotFound`, deliberately distinct from `Validation`. A 404 is
 * neither an error nor an input problem — it's a resolution result.
 *
 * ## Severity
 *
 * `Info` — 404s are expected on every public endpoint (crawlers,
 * probes, stale bookmarks). Never let a 404 wake anyone up.
 *
 * ## Translation keys
 *
 *   exceptions::http.not_found            (class default)
 *   exceptions::http.not_found_resource   ({@see forResource()})
 *
 * @see EntityNotFoundException  Preferred when a specific Eloquent
 *                               model + id is what's missing.
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class NotFoundException extends AcademorixException
{
    /**
     * Stable machine-readable code exposed as `error.code` on the
     * wire. Clients branch on this literal — treat as public API.
     */
    public const CODE = 'http.not_found';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → not_found`. Overridable per-instance via
     * {@see \Academorix\Exceptions\Concerns\TranslatesMessages::withTranslationKey()}.
     */
    public const TRANSLATION_KEY = 'exceptions::http.not_found';

    /**
     * `Info` severity — 404s are noise, never pageable. Alerting on
     * 404 volume happens at the ingestion layer (Prometheus counter
     * rate), not per-throw.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * Dedicated `NotFound` category so dashboards can chart
     * "resource missing" traffic separately from validation failures
     * or upstream errors.
     */
    protected ErrorCategory $category = ErrorCategory::NotFound;

    /**
     * Standard 404 status. Renderers map this straight into the
     * Response's status code.
     */
    protected int $httpStatus = Response::HTTP_NOT_FOUND;

    /**
     * Named factory: point at a specific resource name.
     *
     * `$resource` is a domain noun ("invoice", "user") — it goes
     * into context AND the translation parameters so the user
     * message can name what wasn't found without leaking model
     * class names.
     *
     * @param  string  $resource  Domain noun the caller was looking
     *                            for. Should be a stable label
     *                            (singular, lowercase) so
     *                            dashboards group correctly.
     * @return static The fluent instance with `context.resource`
     *                populated and the more specific
     *                `not_found_resource` translation key applied.
     */
    public static function forResource(string $resource): static
    {
        return static::make("Resource \"{$resource}\" not found.")
            ->withContext(['resource' => $resource])
            ->withTranslationParameters(['resource' => $resource])
            ->withTranslationKey('exceptions::http.not_found_resource');
    }
}
