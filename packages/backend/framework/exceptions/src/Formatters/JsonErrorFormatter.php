<?php

declare(strict_types=1);

namespace Stackra\Exceptions\Formatters;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Data\ErrorEnvelope;
use Stackra\Exceptions\Data\FieldError;
use Stackra\Exceptions\Http\ValidationException;
use Stackra\Exceptions\Support\ExceptionMapper;
use Stackra\Exceptions\Support\MaskingPolicy;
use Stackra\Exceptions\Support\Redactor;
use Stackra\Exceptions\Support\TraceCleaner;
use Stackra\Foundation\Enums\AppEnvironment;
use Stackra\Foundation\Support\CorrelationId;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Formatter that renders any `\Throwable` as a JSON response using
 * the {@see \Stackra\Exceptions\Data\ErrorEnvelope} shape
 * (RFC 7807-flavoured).
 *
 * ## When it fires
 *
 * {@see canFormat()} returns `true` for requests that either:
 *
 *   - Set `Accept: application/json` (or `expectsJson()` per Laravel),
 *   - OR carry a path prefix under `/api/` (bearer-token API clients
 *     that don't set the header),
 *   - OR are XHR / fetch requests.
 *
 * Priority defaults to `100` so JSON wins over the HTML formatter
 * (priority `10`) for API traffic. Downstream apps can override by
 * registering their own formatter at a higher priority.
 *
 * ## Masking
 *
 * Every value that ships to the client passes through the
 * {@see Redactor} + {@see TraceCleaner} pair, gated by the
 * {@see MaskingPolicy} which encodes "how paranoid to be":
 *
 *   - Prod-like + high severity → mask developer message entirely.
 *   - Debuggable env → attach `debug.trace` + `meta.context`.
 *   - Everywhere → mask context values regardless.
 */
final class JsonErrorFormatter implements ErrorFormatterInterface
{
    public function __construct(
        private readonly ExceptionMapper $mapper,
        private readonly Redactor $redactor,
        private readonly TraceCleaner $traceCleaner,
    ) {
    }

    public function canFormat(Request $request): bool
    {
        if ($request->expectsJson()) {
            return true;
        }

        // API prefix — apps mount their APIs under `/api/` per the
        // template convention. This keeps bearer-token clients that
        // omit the Accept header working.
        if ($request->is('api/*')) {
            return true;
        }

        // XHR fallback for legacy clients.
        return $request->ajax();
    }

    public function format(Request $request, Throwable $e): Response
    {
        $mapped = $this->mapper->map($e);
        $env = AppEnvironment::current();
        $policy = MaskingPolicy::forRequest($env, $mapped->severity());

        $envelope = new ErrorEnvelope(
            code: $mapped->errorCode(),
            title: $this->title($mapped),
            status: $mapped->httpStatus(),
            detail: $policy->maskMessage ? null : $this->detail($mapped),
            correlationId: $mapped->correlationId() ?? CorrelationId::current(),
            type: $this->documentationUrl($mapped->errorCode()),
            fields: $this->extractFields($mapped),
            meta: $this->meta($mapped, $policy),
            debug: $policy->includeDebug ? $this->debug($mapped) : null,
            retryAfter: $mapped->retryAfter(),
        );

        $response = new JsonResponse(
            $envelope->jsonSerialize(),
            $mapped->httpStatus(),
            [],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );

        if ($mapped->retryAfter() !== null) {
            $response->headers->set('Retry-After', (string) $mapped->retryAfter());
        }

        return $response;
    }

    public function priority(): int
    {
        return 100;
    }

    // ---------------------------------------------------------------
    // Envelope helpers
    // ---------------------------------------------------------------

    /**
     * The client-facing title. Prefer the (translated + safe) user
     * message; fall back to the redacted developer message; fall
     * back to the humanised error code.
     */
    private function title(Exception $e): string
    {
        $userMessage = $e->userMessage();
        if ($userMessage !== null && $userMessage !== '') {
            return $userMessage;
        }

        if ($e->getMessage() !== '') {
            return $this->redactor->redactString($e->getMessage());
        }

        return ucwords(str_replace(['_', '.'], ' ', $e->errorCode()));
    }

    /**
     * The optional `detail` — a longer developer-facing message,
     * suppressed by the masking policy for high-severity errors in
     * production.
     */
    private function detail(Exception $e): ?string
    {
        $developer = $e->getMessage();
        $user = $e->userMessage();

        if ($developer === '' || $developer === $user) {
            return null;
        }

        return $this->redactor->redactString($developer);
    }

    /**
     * Build the `error.type` URI. Uses configured docs base URL when
     * available; falls back to a URN so the field is always
     * parseable.
     */
    private function documentationUrl(string $code): string
    {
        $base = (string) (function_exists('config') ? config('exceptions.docs_url', '') : '');

        return $base === ''
            ? "urn:stackra:error:{$code}"
            : rtrim($base, '/') . '/' . $code;
    }

    /**
     * Extract validation `fields[]` from `ValidationException`. Field
     * messages are already translated upstream, so they're not run
     * through the redactor.
     *
     * @return list<FieldError>
     */
    private function extractFields(Exception $e): array
    {
        if (! $e instanceof ValidationException) {
            return [];
        }

        $out = [];
        foreach ($e->fields() as $field => $messages) {
            $out[] = new FieldError($field, $messages);
        }

        return $out;
    }

    /**
     * Build the `meta` block. Severity + category always ship;
     * context only ships when the policy allows AND we're in a
     * debuggable env, and even there it goes through the redactor.
     *
     * @return array<string, mixed>
     */
    private function meta(Exception $e, MaskingPolicy $policy): array
    {
        $meta = [
            'severity' => $e->severity()->value,
            'category' => $e->category()->value,
        ];

        if ($policy->includeDebug && $e->context() !== []) {
            $meta['context'] = $policy->maskContext
                ? $this->redactor->redact($e->context())
                : $e->context();
        }

        return $meta;
    }

    /**
     * Build the `debug` block via the trace cleaner. Populated only
     * when the masking policy says so.
     *
     * @return array<string, mixed>
     */
    private function debug(Exception $e): array
    {
        return $this->traceCleaner->describe($e);
    }
}
