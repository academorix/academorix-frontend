<?php

/**
 * @file packages/exceptions/src/Http/EntityNotFoundException.php
 *
 * @description
 * HTTP 404 — a specific Eloquent model instance is missing. Preferred
 * over Laravel's `ModelNotFoundException`; the mapper converts the
 * framework type into this class automatically at the handler
 * boundary.
 *
 * ## Structured context
 *
 * The named factory attaches:
 *
 *   - `model`  string — fully-qualified class name
 *   - `id`     int|string|null — the primary key that was searched for
 *
 * Dashboards can group "invoice 1234 missing" separately from
 * "user route wildcard missing" using these keys.
 *
 * ## Translation key
 *
 *   exceptions::http.entity_not_found
 *
 * The default message is deliberately generic ("That record no longer
 * exists.") so we don't leak the model class name to end users. If
 * a specific locale wants to include it, translate against the
 * `:model` placeholder.
 *
 * @see NotFoundException  Parent class for generic URL-level 404s.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

class EntityNotFoundException extends NotFoundException
{
    /**
     * Distinct code from `http.not_found` so clients can branch —
     * "entity missing" often means the record was deleted since the
     * user last loaded the page; "url missing" is closer to a
     * routing bug on the client.
     */
    public const CODE = 'http.entity_not_found';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → entity_not_found`. Overridable per
     * instance via the trait's
     * {@see \Academorix\Exceptions\Concerns\TranslatesMessages::withTranslationKey()}.
     */
    public const TRANSLATION_KEY = 'exceptions::http.entity_not_found';

    /**
     * Named factory: the model class + primary key that failed to
     * resolve.
     *
     * `$id` is loosely typed because primary keys can be int, ULID,
     * or nullable (e.g. Eloquent's `findOrFail(null)` routing
     * through here). The user-visible translation receives only the
     * short class name (`class_basename`) so we never leak
     * namespaces to clients.
     *
     * @param  string           $modelClass  Fully-qualified Eloquent
     *                                       model class name — kept
     *                                       verbatim in context for
     *                                       dashboard grouping.
     * @param  int|string|null  $id          Primary key that was
     *                                       being searched for. May
     *                                       be null when the caller
     *                                       hit `findOrFail(null)`.
     * @return static The fluent instance with model + id in both
     *                context and translation parameters.
     */
    public static function forModel(string $modelClass, int|string|null $id = null): static
    {
        $suffix = $id === null ? '' : " with id [{$id}]";

        return static::make("Model {$modelClass}{$suffix} not found.")
            ->withContext(['model' => $modelClass, 'id' => $id])
            ->withTranslationParameters([
                'model' => class_basename($modelClass),
                'id' => $id === null ? '' : (string) $id,
            ]);
    }
}
