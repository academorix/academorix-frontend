<?php

/**
 * @file packages/routing/src/Http/ResponseBuilder.php
 *
 * @description
 * Slim, self-contained response builder that replaces the deleted
 * `packages/response/` package. Owns exactly one concern: shape a
 * uniform JSON envelope and emit an `Illuminate\Http\JsonResponse`.
 *
 * ## Envelope shape
 *
 *     {
 *       "success": true,
 *       "message": "OK",
 *       "data": { ... },
 *       "meta":  { "pagination": { ... }, ... },
 *       "links": { "self": { "href": "...", "method": "GET" }, ... },
 *       "errors": { "field": ["msg", ...] },
 *       "request_id": "...",
 *       "timestamp": "2026-07-11T..."
 *     }
 *
 * Optional blocks (`data`, `meta`, `links`, `errors`) are omitted
 * when empty so downstream consumers can rely on presence-checks
 * without null-forgiveness.
 *
 * ## Design notes
 *
 *   - **No facade, no DI, no plugin architecture.** The whole
 *     package `packages/response/` tried to build a plugin
 *     ecosystem (renderers, presets, resolvers, transformers) for
 *     a system with one renderer (JSON). This class collapses
 *     that to the ~150 lines that actually delivered value.
 *
 *   - **Not `#[Scoped]`.** Every `$this->response()` call in a
 *     controller creates a fresh instance. Cheap — no
 *     container round-trip, and it means chained mutations can't
 *     leak between requests on the same Octane worker.
 *
 *   - **`toResponse()` returns `JsonResponse`.** Laravel's
 *     `Responsable` contract expects a Symfony Response; we
 *     specialise to JsonResponse because that's the whole point.
 *     Non-JSON responses (Blade views, streams) belong on
 *     Controller helpers that don't route through this builder.
 *
 *   - **Correlation id + request timestamp** are read on the fly
 *     from the foundation's {@see \Academorix\Foundation\Support\CorrelationId}
 *     if the class is available, falling back to a locally-generated
 *     ULID-ish string so the class stays usable in isolation.
 *
 * @see \Academorix\Routing\Concerns\InteractsWithResponse Trait that returns builder instances.
 */

declare(strict_types=1);

namespace Academorix\Routing\Http;

use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fluent JSON response builder.
 *
 * Chain setters, then either `return` it from a controller (Laravel
 * calls {@see toResponse()} via the `Responsable` contract) or call
 * {@see toResponse()} explicitly.
 *
 * ## Usage
 *
 * ```php
 * return $this->response()
 *     ->ok($user)
 *     ->message('Retrieved')
 *     ->addLink('self', route('users.show', $user))
 *     ->header('X-Trace-Id', $traceId);
 * ```
 *
 * All setters return `$this` for chaining; `toResponse()` is the
 * terminal call.
 *
 * @final
 */
final class ResponseBuilder implements Responsable
{
    // -----------------------------------------------------------------
    // Envelope key constants — treat as public API. Consumers grep
    // for these when writing response schemas / codegen.
    // -----------------------------------------------------------------

    /** Boolean flag: `true` for 2xx responses, `false` otherwise. */
    public const string KEY_SUCCESS = 'success';

    /** Human-readable one-line summary. */
    public const string KEY_MESSAGE = 'message';

    /** Primary payload. Present unless the response is void (204, errors). */
    public const string KEY_DATA = 'data';

    /** Structured metadata block (pagination, counts, extra context). */
    public const string KEY_META = 'meta';

    /** HATEOAS link map. */
    public const string KEY_LINKS = 'links';

    /** Field-level validation errors. */
    public const string KEY_ERRORS = 'errors';

    /** Correlation id echoed back to the client. */
    public const string KEY_REQUEST_ID = 'request_id';

    /** ISO-8601 UTC timestamp of response construction. */
    public const string KEY_TIMESTAMP = 'timestamp';

    /**
     * HTTP header used to echo the request/correlation id.
     * Kept as a constant so downstream consumers (proxies,
     * dashboards) grep for the exact literal.
     */
    public const string HEADER_REQUEST_ID = 'X-Request-Id';

    // -----------------------------------------------------------------
    // State — all private, mutated only via the fluent setters.
    // -----------------------------------------------------------------

    /**
     * Success flag. Defaults to `true`; error factories flip it to
     * `false` and set an appropriate HTTP status.
     */
    private bool $success = true;

    /**
     * HTTP status. Defaults to 200; error factories overwrite.
     */
    private int $status = Response::HTTP_OK;

    /** Human-readable message; null → the JSON envelope omits it. */
    private ?string $message = null;

    /**
     * Payload. `null` means "omit the `data` key from the envelope";
     * `false` / `0` / empty string are legitimate payloads and are
     * kept as-is.
     */
    private mixed $data = null;

    /**
     * Meta block. Keyed by convention:
     *   - `pagination` — filled by {@see paginate()}
     *   - anything else — caller-defined.
     *
     * @var array<string, mixed>
     */
    private array $meta = [];

    /**
     * HATEOAS links. Each entry: `['href' => string, 'method' => string]`.
     *
     * @var array<string, array{href: string, method: string}>
     */
    private array $links = [];

    /**
     * Field-level errors. Populated by {@see errors()} or the
     * `unprocessable()` factory.
     *
     * @var array<string, list<string>>
     */
    private array $errors = [];

    /**
     * Custom response headers to attach in {@see toResponse()}.
     * `X-Request-Id` is always emitted; anything here is layered
     * on top.
     *
     * @var array<string, string>
     */
    private array $headers = [];

    // -----------------------------------------------------------------
    // Status factories — succinct entry points from InteractsWithResponse.
    // -----------------------------------------------------------------

    /** Fresh builder. Every {@see \Academorix\Routing\Concerns\InteractsWithResponse::response()} call yields one. */
    public static function make(): self
    {
        return new self();
    }

    /** 200. Data is optional — pass `null` to build an "OK, no body" success envelope. */
    public function ok(mixed $data = null): self
    {
        $this->success = true;
        $this->status = Response::HTTP_OK;

        if ($data !== null) {
            $this->data = $data;
        }

        return $this;
    }

    /** 201. Typical usage: `$this->response()->created($model)`. */
    public function created(mixed $data = null): self
    {
        $this->success = true;
        $this->status = Response::HTTP_CREATED;

        if ($data !== null) {
            $this->data = $data;
        }

        return $this;
    }

    /** 202. Long-running operations that returned an acknowledgement. */
    public function accepted(mixed $data = null): self
    {
        $this->success = true;
        $this->status = Response::HTTP_ACCEPTED;

        if ($data !== null) {
            $this->data = $data;
        }

        return $this;
    }

    /**
     * 204. The renderer emits an empty body and drops the envelope
     * entirely — 204 responses MUST NOT have a body per RFC 7230.
     */
    public function noContent(): self
    {
        $this->success = true;
        $this->status = Response::HTTP_NO_CONTENT;
        $this->data = null;
        $this->message = null;

        return $this;
    }

    /** 400 — malformed request the caller could fix on retry. */
    public function badRequest(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_BAD_REQUEST;
        $this->message = $message;

        return $this;
    }

    /** 401 — missing / invalid credentials. */
    public function unauthorized(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_UNAUTHORIZED;
        $this->message = $message;

        return $this;
    }

    /** 403 — authenticated but not permitted. */
    public function forbidden(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_FORBIDDEN;
        $this->message = $message;

        return $this;
    }

    /** 404 — resource does not exist. */
    public function notFound(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_NOT_FOUND;
        $this->message = $message;

        return $this;
    }

    /** 409 — state conflict (duplicate resource, optimistic lock). */
    public function conflict(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_CONFLICT;
        $this->message = $message;

        return $this;
    }

    /**
     * 422 — semantic-level rejection. `$errors` is the field-map,
     * `$message` a friendly top-level summary.
     *
     * @param  array<string, list<string>|string>|null  $errors
     */
    public function unprocessable(?array $errors = null, ?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_UNPROCESSABLE_ENTITY;
        $this->message = $message;

        if ($errors !== null) {
            $this->errors($errors);
        }

        return $this;
    }

    /** 500 — the caller can't fix this. */
    public function serverError(?string $message = null): self
    {
        $this->success = false;
        $this->status = Response::HTTP_INTERNAL_SERVER_ERROR;
        $this->message = $message;

        return $this;
    }

    // -----------------------------------------------------------------
    // Fluent setters — chained after a status factory.
    // -----------------------------------------------------------------

    /**
     * Override the status. Useful for statuses not covered by a
     * named factory (e.g. 418, 429, 503).
     */
    public function status(int $status): self
    {
        $this->status = $status;
        $this->success = $status >= 200 && $status < 300;

        return $this;
    }

    /** Set the human-readable message. */
    public function message(?string $message): self
    {
        $this->message = $message;

        return $this;
    }

    /**
     * Replace the payload. Accepts anything — arrays, models,
     * JsonResource instances, arbitrary scalars — and is
     * normalised in {@see resolveData()} at emit time.
     */
    public function data(mixed $data): self
    {
        $this->data = $data;

        return $this;
    }

    /**
     * Attach a paginator. Extracts the items into `data` and the
     * cursor/page metadata into `meta.pagination`.
     */
    public function paginate(LengthAwarePaginator|CursorPaginator|Paginator $paginator): self
    {
        $this->data = $paginator->items();
        $this->meta['pagination'] = $this->extractPaginationMeta($paginator);

        return $this;
    }

    /**
     * Merge additional meta keys into the block. Later calls
     * overwrite earlier ones on collision (last-write-wins).
     *
     * @param  array<string, mixed>  $meta
     */
    public function meta(array $meta): self
    {
        $this->meta = array_replace($this->meta, $meta);

        return $this;
    }

    /** Overwrite the errors block. */
    /** @param  array<string, list<string>|string>  $errors */
    public function errors(array $errors): self
    {
        $normalised = [];
        foreach ($errors as $field => $messages) {
            $normalised[$field] = is_array($messages)
                ? array_values(array_map('strval', $messages))
                : [(string) $messages];
        }
        $this->errors = $normalised;

        return $this;
    }

    /**
     * Attach a HATEOAS link. Repeated calls for the same `rel`
     * overwrite (RFC 8288 rel values must be unique per resource).
     */
    public function addLink(string $rel, string $href, string $method = 'GET'): self
    {
        $this->links[$rel] = ['href' => $href, 'method' => strtoupper($method)];

        return $this;
    }

    /**
     * Merge a link map. Same overwrite semantics as
     * {@see addLink()} per rel.
     *
     * @param  array<string, array{href: string, method?: string}>  $links
     */
    public function links(array $links): self
    {
        foreach ($links as $rel => $link) {
            $this->addLink($rel, $link['href'], $link['method'] ?? 'GET');
        }

        return $this;
    }

    /**
     * Add a response header. Emitted by {@see toResponse()} on top
     * of the framework-provided defaults.
     */
    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;

        return $this;
    }

    /** @param  array<string, string>  $headers */
    public function headers(array $headers): self
    {
        $this->headers = array_replace($this->headers, $headers);

        return $this;
    }

    // -----------------------------------------------------------------
    // Terminal — emit the JsonResponse.
    // -----------------------------------------------------------------

    /**
     * Laravel's `Responsable` contract entry point. Called
     * automatically when a controller returns `$this`.
     *
     * The `$request` argument is untyped in the contract signature
     * for backwards-compat; we don't need it for envelope
     * assembly.
     *
     * @param  \Illuminate\Http\Request  $request  Unused — kept for contract compliance.
     */
    public function toResponse($request): JsonResponse
    {
        // 204 must not carry a body — short-circuit before the
        // envelope assembly.
        if ($this->status === Response::HTTP_NO_CONTENT) {
            return new JsonResponse(status: Response::HTTP_NO_CONTENT, headers: $this->buildHeaders());
        }

        $envelope = $this->buildEnvelope();

        return new JsonResponse(
            data: $envelope,
            status: $this->status,
            headers: $this->buildHeaders(),
        );
    }

    // -----------------------------------------------------------------
    // Assembly helpers — private, unit-tested via toResponse().
    // -----------------------------------------------------------------

    /**
     * Build the outbound envelope. Only includes non-empty blocks
     * so consumers can rely on presence checks.
     *
     * @return array<string, mixed>
     */
    private function buildEnvelope(): array
    {
        $envelope = [
            self::KEY_SUCCESS => $this->success,
            self::KEY_TIMESTAMP => $this->currentTimestamp(),
            self::KEY_REQUEST_ID => $this->currentRequestId(),
        ];

        if ($this->message !== null) {
            // Insert message right after `success` for readability.
            $envelope = [
                self::KEY_SUCCESS => $this->success,
                self::KEY_MESSAGE => $this->message,
                self::KEY_TIMESTAMP => $envelope[self::KEY_TIMESTAMP],
                self::KEY_REQUEST_ID => $envelope[self::KEY_REQUEST_ID],
            ];
        }

        if ($this->data !== null) {
            $envelope[self::KEY_DATA] = $this->resolveData($this->data);
        }

        if ($this->meta !== []) {
            $envelope[self::KEY_META] = $this->meta;
        }

        if ($this->links !== []) {
            $envelope[self::KEY_LINKS] = $this->links;
        }

        if ($this->errors !== []) {
            $envelope[self::KEY_ERRORS] = $this->errors;
        }

        return $envelope;
    }

    /**
     * Merge caller-supplied headers with the standard set. The
     * `X-Request-Id` echo is always added; caller-set headers
     * always win on collision so tests can override it.
     *
     * @return array<string, string>
     */
    private function buildHeaders(): array
    {
        return array_replace(
            [self::HEADER_REQUEST_ID => $this->currentRequestId()],
            $this->headers,
        );
    }

    /**
     * Normalise payload types into a shape `json_encode` won't
     * choke on. Handles the common cases (JsonResource, Arrayable,
     * Traversable) explicitly; anything else is passed through and
     * left to JsonResponse's serialiser.
     */
    private function resolveData(mixed $data): mixed
    {
        // JsonResource / ResourceCollection carry their own
        // request-driven serialisation; resolve() to invoke
        // toArray() on the current request.
        if ($data instanceof JsonResource || $data instanceof ResourceCollection) {
            /** @var \Illuminate\Http\Request $request */
            $request = request();

            return $data->toResponse($request)->getData(true);
        }

        if ($data instanceof Arrayable) {
            return $data->toArray();
        }

        return $data;
    }

    /**
     * Extract pagination metadata from any of the three paginator
     * flavours. Returned block is safe to include in the envelope
     * — no reference to the underlying model or query state.
     *
     * @return array<string, mixed>
     */
    private function extractPaginationMeta(
        LengthAwarePaginator|CursorPaginator|Paginator $paginator,
    ): array {
        if ($paginator instanceof LengthAwarePaginator) {
            return [
                'total' => $paginator->total(),
                // The `count` reflects how many items are on the
                // CURRENT page (not the grand total). Using
                // `count($paginator->items())` because the contract
                // interface — as opposed to the concrete class —
                // doesn't declare Countable.
                'count' => count($paginator->items()),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'has_more_pages' => $paginator->hasMorePages(),
            ];
        }

        if ($paginator instanceof CursorPaginator) {
            return [
                'per_page' => $paginator->perPage(),
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'prev_cursor' => $paginator->previousCursor()?->encode(),
                'has_more_pages' => $paginator->hasMorePages(),
            ];
        }

        // Plain Paginator (simple pagination — no total count).
        return [
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'has_more_pages' => $paginator->hasMorePages(),
        ];
    }

    /**
     * ISO-8601 UTC timestamp with millisecond precision.
     * Deliberately generated at emit time (not at construction)
     * so callers who cache builder instances still get accurate
     * timestamps.
     */
    private function currentTimestamp(): string
    {
        return (new DateTimeImmutable('now', new DateTimeZone('UTC')))
            ->format('Y-m-d\TH:i:s.v\Z');
    }

    /**
     * Resolve the correlation / request id. Prefers the
     * foundation's {@see \Academorix\Foundation\Support\CorrelationId}
     * when the class is available (it's the same source
     * exceptions read from); falls back to the current request's
     * `X-Request-Id` header, then to a locally-generated random
     * string so the envelope always carries an id.
     */
    private function currentRequestId(): string
    {
        // Foundation-provided correlation id — first choice because
        // it matches the id exceptions attach to error responses.
        // Guarded with class_exists so the routing package remains
        // usable in a stripped-down test environment without
        // foundation loaded.
        if (class_exists(\Academorix\Foundation\Support\CorrelationId::class)) {
            $current = \Academorix\Foundation\Support\CorrelationId::current();
            if (is_string($current) && $current !== '') {
                return $current;
            }
        }

        // Second-best: the client-supplied header, if any.
        $request = request();
        if ($request !== null) {
            $header = $request->headers->get(self::HEADER_REQUEST_ID);
            if (is_string($header) && $header !== '') {
                return $header;
            }
        }

        // Last resort — a short random string. Not cryptographic;
        // it exists purely so downstream logs can pivot on a
        // per-request key even when no correlation infrastructure
        // is set up.
        return bin2hex(random_bytes(8));
    }
}
