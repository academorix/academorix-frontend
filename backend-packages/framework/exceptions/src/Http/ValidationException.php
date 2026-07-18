<?php

/**
 * @file packages/exceptions/src/Http/ValidationException.php
 *
 * @description
 * HTTP 422 — one or more input fields failed validation rules.
 * Preferred over Laravel's built-in
 * `\Illuminate\Validation\ValidationException` because:
 *
 *   - The mapper converts framework validation exceptions into
 *     this class before the renderer sees them, so response shape
 *     stays uniform.
 *   - Domain layers that don't want to pull in the validator can
 *     still emit field-level errors:
 *
 *         throw ValidationException::withErrors([
 *             'email' => 'This email is already registered.',
 *         ]);
 *
 * ## Field payload shape
 *
 * The internal `$fields` map keys field names to a list of already-
 * translated messages:
 *
 *     [
 *       'name'  => ['The name is required.'],
 *       'email' => ['Not a valid email.', 'Domain not allowed.'],
 *     ]
 *
 * Note: field-level messages are NOT run back through the exception
 * translator — Laravel's validator already localised them, and
 * domain-layer messages should be pre-translated by the caller. Only
 * the top-level `userMessage` ("Please review the highlighted fields
 * and try again.") is translated by this class.
 *
 * ## Translation key
 *
 *   exceptions::http.validation
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see UnprocessableEntityException  Sibling class for 422s that
 *      aren't field-level (business-rule semantic rejections).
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Http;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class ValidationException extends AcademorixException
{
    /**
     * Machine-readable code exposed as `error.code`. Front-end forms
     * key their field-level error rendering off this literal — treat
     * as public API.
     */
    public const CODE = 'http.validation';

    /**
     * Class-level translation key pointing at
     * `lang/en/http.php → validation`. Only the top-level message
     * runs through this — field messages are already-translated by
     * upstream code.
     */
    public const TRANSLATION_KEY = 'exceptions::http.validation';

    /**
     * `Info` severity — validation failures are the shape of a
     * healthy API talking to real users. Never pageable.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Info;

    /**
     * `Validation` category — the canonical bucket. Sibling classes
     * (`UnsupportedMediaType`, `PayloadTooLarge`) share this
     * category by design.
     */
    protected ErrorCategory $category = ErrorCategory::Validation;

    /**
     * 422 — the standard "server understood your request but the
     * content is semantically invalid" status.
     */
    protected int $httpStatus = Response::HTTP_UNPROCESSABLE_ENTITY;

    /**
     * Per-field validation errors. Kept as a first-class property
     * (not just a context entry) so the renderer can populate the
     * `fields[]` block of the response without introspecting
     * context shape. Also mirrored into `context.fields` so
     * reporters that only see the context payload still get the
     * field map.
     *
     * @var array<string, list<string>>
     */
    private array $fields = [];

    /**
     * Named factory: build from an already-localised error map, as
     * returned by `Validator::errors()->toArray()` or hand-rolled by
     * a domain service.
     *
     * Accepts either a list<string> per field (already-normalised
     * shape) or a bare string (single-message convenience). Both are
     * normalised into the canonical `list<string>` shape so the
     * renderer only has one contract to consume.
     *
     * @param  array<string, list<string>|string>  $errors   Map of
     *                                                       field name →
     *                                                       message list
     *                                                       or single
     *                                                       message.
     * @param  string                              $message  Developer-facing
     *                                                       message
     *                                                       stored on
     *                                                       `Throwable::getMessage()`.
     *                                                       Never seen by
     *                                                       clients when
     *                                                       severity >= error.
     * @return static The fluent instance carrying the normalised
     *                field map in both `$fields` and
     *                `context.fields`.
     */
    public static function withErrors(array $errors, string $message = 'Validation failed.'): static
    {
        $normalised = [];
        foreach ($errors as $field => $messages) {
            $normalised[$field] = is_array($messages)
                ? array_values($messages)
                : [$messages];
        }

        $instance = static::make($message);
        $instance->fields = $normalised;
        $instance->context['fields'] = $normalised;

        return $instance;
    }

    /**
     * Read the collected field errors.
     *
     * Prefer this accessor over `context()['fields']` — the property
     * is the source of truth; the context mirror is a rendering
     * convenience that could drift if code paths accumulate context
     * separately.
     *
     * @return array<string, list<string>>  Map of field name to
     *                                      list of already-localised
     *                                      messages.
     */
    public function fields(): array
    {
        return $this->fields;
    }

    /**
     * Add another field error after construction — useful when a
     * multi-step domain action accumulates errors before deciding
     * to throw.
     *
     * Mirrors the mutation into `context.fields` so both accessors
     * stay in sync.
     *
     * @param  string  $field    Field identifier that failed.
     * @param  string  $message  Already-localised error message.
     * @return static The fluent instance for further chaining.
     */
    public function addField(string $field, string $message): static
    {
        $this->fields[$field][] = $message;
        $this->context['fields'] = $this->fields;

        return $this;
    }
}
