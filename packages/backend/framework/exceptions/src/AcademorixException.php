<?php

declare(strict_types=1);

namespace Academorix\Exceptions;

use Academorix\Exceptions\Concerns\TranslatesMessages;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Academorix\Foundation\Contracts\Correlatable;
use Academorix\Foundation\Contracts\HasContext;
use Academorix\Foundation\Contracts\HasErrorCode;
use Academorix\Foundation\Contracts\HasUserMessage;
use Academorix\Foundation\Support\CorrelationId;
use JsonSerializable;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Root of every custom exception in the Academorix codebase. Extends
 * `RuntimeException` (unchecked — PHP has no checked exceptions and
 * pretending otherwise is an anti-pattern) and layers on the
 * metadata every downstream consumer needs.
 *
 * ## Responsibilities
 *
 * 1. **Uniform metadata** — `errorCode`, `severity`, `category`,
 *    `httpStatus`, `userMessage`, `context`, `retryAfter`,
 *    `correlationId` present on every subclass.
 *
 * 2. **Static factory `::make()`** — inherited by every subclass;
 *    named factories delegate to it so we have one construction path
 *    that preserves subclass typing via `static` return.
 *
 * 3. **Translation** — provided by the {@see TranslatesMessages}
 *    trait. Every subclass declares a stable `TRANSLATION_KEY`
 *    constant pointing at `exceptions::<file>.<key>` (e.g.
 *    `exceptions::auth.forbidden`); the trait's
 *    {@see TranslatesMessages::resolveTranslatedMessage()} hits
 *    Laravel's translator with the exception's replacements
 *    interpolated.
 *
 * 4. **Rendering** — DELEGATED to the container-bound
 *    {@see \Academorix\Exceptions\Handler} which walks the
 *    formatter chain (JSON / HTML / GraphQL). The base doesn't
 *    implement `Renderable` any more — that's now the handler's
 *    concern, keeping the exception itself free of transport
 *    logic.
 *
 * 5. **Serialization** — `toArray()` + `jsonSerialize()` return the
 *    full metadata snapshot. Reporters use this shape; the JSON
 *    formatter picks fields off it explicitly rather than shipping
 *    the whole thing.
 */
abstract class AcademorixException extends RuntimeException implements
    Correlatable,
    HasContext,
    HasErrorCode,
    HasUserMessage,
    JsonSerializable
{
    use TranslatesMessages;

    /**
     * Stable, machine-readable error code. Every subclass overrides.
     * Naming convention: `<domain>.<subdomain>.<event>`, lower
     * snake_case. Treat as a public API — never rename without a
     * deprecation window.
     */
    public const CODE = 'academorix.unexpected';

    /**
     * Translation key used when the trait resolves `userMessage()`.
     * Points at `exceptions::<file>.<key>` under the split lang
     * layout — e.g. `exceptions::auth.forbidden`. Subclasses can
     * still override per-instance via
     * {@see TranslatesMessages::withTranslationKey()}.
     */
    public const TRANSLATION_KEY = 'exceptions::generic.unexpected';

    /**
     * Log-level severity. Drives PSR-3 level, Sentry tag, and
     * whether the JSON formatter masks the raw developer message
     * from clients in production. Override in subclasses via
     * property default.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Error;

    /**
     * Coarse-grained bucket for dashboards / Sentry tags / metric
     * labels. Orthogonal to HTTP status.
     */
    protected ErrorCategory $category = ErrorCategory::Unexpected;

    /**
     * HTTP status the renderer emits. Kept on the instance so
     * callers can override per-throw when a rule spans multiple
     * categories.
     */
    protected int $httpStatus = Response::HTTP_INTERNAL_SERVER_ERROR;

    /**
     * Non-translated fallback for `userMessage()`. Used verbatim
     * when the translator lookup returns the key unchanged (missing
     * translation) or fails outright.
     */
    protected ?string $userMessage = null;

    /**
     * `Retry-After` value in seconds. Echoed by the JSON formatter
     * as both a response header and an `error.retryAfter` body
     * field. Populated automatically by 429 / 503 exceptions;
     * others may set it via {@see withRetryAfter()}.
     */
    protected ?int $retryAfter = null;

    /**
     * Structured metadata. Reserved for logs, Sentry contexts, and
     * (in debug envs) the JSON envelope's `meta.context` block.
     * Never contains raw secrets — the Redactor runs this through
     * on the way out to the wire.
     *
     * @var array<string, mixed>
     */
    protected array $context = [];

    /**
     * Correlation id snapshotted at construction time. Persisted so
     * queued jobs / re-serialised exceptions retain the id even
     * after the request-scoped static state has been forgotten.
     */
    protected ?string $correlationId = null;

    /**
     * Direct construction is allowed but rarely needed. Prefer
     * `::make()` for fluent style or a named factory on the
     * subclass.
     */
    public function __construct(
        string $message = '',
        ?Throwable $previous = null,
        int $code = 0,
    ) {
        parent::__construct(
            $message === '' ? $this->defaultMessage() : $message,
            $code,
            $previous,
        );

        $this->correlationId = CorrelationId::current();
    }

    /**
     * Static factory. Inherited by every subclass — returns `static`
     * so IDEs / phpstan preserve the concrete subclass type through
     * the fluent chain:
     *
     *     $e = BusinessRuleException::make('Rule X failed.')
     *         ->withContext(['rule_id' => 'X'])
     *         ->withUserMessage('That action is not allowed here.');
     */
    public static function make(string $message = '', ?Throwable $previous = null): static
    {
        return new static($message, $previous);
    }

    /**
     * Override in subclasses that want a friendlier developer
     * message when the caller passes an empty string. Default: the
     * error code itself, which is at least searchable.
     */
    protected function defaultMessage(): string
    {
        return static::CODE;
    }

    // ---------------------------------------------------------------
    // Metadata accessors
    // ---------------------------------------------------------------

    public function errorCode(): string
    {
        return static::CODE;
    }

    public function severity(): ErrorSeverity
    {
        return $this->severity;
    }

    public function category(): ErrorCategory
    {
        return $this->category;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    public function retryAfter(): ?int
    {
        return $this->retryAfter;
    }

    public function correlationId(): ?string
    {
        return $this->correlationId ??= CorrelationId::current();
    }

    /** @return array<string, mixed> */
    public function context(): array
    {
        return $this->context;
    }

    /**
     * Resolve the client-safe message. Preference order:
     *
     *   1. Explicit `withUserMessage(...)` literal on this instance.
     *   2. Trait-based translation lookup on `translationKey()`.
     *   3. Class-level `$userMessage` default.
     *   4. `null` — the formatter falls back to a generic title.
     *
     * The trait handles step 2. Steps 1/3/4 live here so the base
     * class stays in control of when the trait fires.
     */
    public function userMessage(): ?string
    {
        // Instance override wins outright — used by named factories
        // that want to hand the caller a message the translator
        // wouldn't know about.
        if ($this->userMessage !== null) {
            return $this->interpolateFallback($this->userMessage);
        }

        $translated = $this->resolveTranslatedMessage();
        if ($translated !== null) {
            return $translated;
        }

        return null;
    }

    // ---------------------------------------------------------------
    // Fluent setters — mutating for ergonomics.
    // ---------------------------------------------------------------

    /**
     * Merge additional key/value pairs into the context array.
     *
     * @param array<string, mixed> $extra
     */
    public function withContext(array $extra): static
    {
        $this->context = array_replace($this->context, $extra);

        return $this;
    }

    public function withContextValue(string $key, mixed $value): static
    {
        $this->context[$key] = $value;

        return $this;
    }

    public function withUserMessage(?string $message): static
    {
        $this->userMessage = $message;

        return $this;
    }

    public function withSeverity(ErrorSeverity $severity): static
    {
        $this->severity = $severity;

        return $this;
    }

    public function withCategory(ErrorCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function withHttpStatus(int $status): static
    {
        $this->httpStatus = $status;

        return $this;
    }

    public function withRetryAfter(?int $seconds): static
    {
        $this->retryAfter = $seconds;

        return $this;
    }

    public function withCorrelationId(?string $id): static
    {
        $this->correlationId = $id;

        return $this;
    }

    // ---------------------------------------------------------------
    // Serialisation helpers.
    // ---------------------------------------------------------------

    /**
     * Full instance snapshot — used by reporters and the JSON
     * formatter. Returns RAW context; downstream code applies
     * masking separately.
     *
     * @return array{
     *   code: string,
     *   message: string,
     *   userMessage: string|null,
     *   status: int,
     *   severity: string,
     *   category: string,
     *   context: array<string, mixed>,
     *   translationKey: string|null,
     *   translationParameters: array<string, scalar|\Stringable>,
     *   correlationId: string|null,
     *   retryAfter: int|null,
     * }
     */
    public function toArray(): array
    {
        return [
            'code' => $this->errorCode(),
            'message' => $this->getMessage(),
            'userMessage' => $this->userMessage(),
            'status' => $this->httpStatus,
            'severity' => $this->severity->value,
            'category' => $this->category->value,
            'context' => $this->context,
            'translationKey' => $this->translationKey(),
            'translationParameters' => $this->translationParameters(),
            'correlationId' => $this->correlationId(),
            'retryAfter' => $this->retryAfter,
        ];
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }

    // ---------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------

    /**
     * Simple `:placeholder` interpolation used against the literal
     * `$userMessage` fallback. Mirrors Laravel translator behaviour
     * so the message reads the same whether translation is loaded
     * or not.
     */
    private function interpolateFallback(string $template): string
    {
        $replacements = $this->translationParameters();

        if ($replacements === []) {
            return $template;
        }

        $pairs = [];
        foreach ($replacements as $key => $value) {
            $pairs[':' . $key] = $value === null ? '' : (string) $value;
        }

        return strtr($template, $pairs);
    }
}
