<?php

/**
 * @file packages/exceptions/src/Data/ErrorEnvelope.php
 *
 * @description
 * Canonical JSON error response body. RFC 7807 (Problem Details for
 * HTTP APIs) inspired — we don't use `application/problem+json` as the
 * content type because our success responses ship
 * `application/json`, and mixing content types confuses fetch-based
 * clients. The *shape* mirrors 7807 fields:
 *
 *   {
 *     "error": {
 *       "type":       "https://errors.stackra.com/http.validation",
 *       "code":       "http.validation",
 *       "title":      "Validation failed.",
 *       "status":     422,
 *       "detail":     "The submitted data is invalid.",
 *       "correlationId": "01H5MZ...",
 *       "fields":     [ { "field": "email", "messages": ["Required."] } ],
 *       "meta":       { "context": {...}, "severity": "info", "category": "validation" },
 *       "debug":      { ... }   // only in non-prod
 *     }
 *   }
 *
 * `debug` is populated only when `AppEnvironment::current()->isDebuggable()`
 * so we never leak stack traces to production clients.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Data;

use JsonSerializable;

final class ErrorEnvelope implements JsonSerializable
{
    /**
     * @param list<FieldError> $fields
     * @param array<string, mixed> $meta
     * @param array<string, mixed>|null $debug
     */
    public function __construct(
        public readonly string $code,
        public readonly string $title,
        public readonly int $status,
        public readonly ?string $detail = null,
        public readonly ?string $correlationId = null,
        public readonly ?string $type = null,
        public readonly array $fields = [],
        public readonly array $meta = [],
        public readonly ?array $debug = null,
        public readonly ?int $retryAfter = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        $error = [
            'type' => $this->type ?? "urn:stackra:error:{$this->code}",
            'code' => $this->code,
            'title' => $this->title,
            'status' => $this->status,
        ];

        if ($this->detail !== null) {
            $error['detail'] = $this->detail;
        }

        if ($this->correlationId !== null) {
            $error['correlationId'] = $this->correlationId;
        }

        if ($this->fields !== []) {
            $error['fields'] = array_map(
                static fn (FieldError $f): array => $f->jsonSerialize(),
                $this->fields,
            );
        }

        if ($this->retryAfter !== null) {
            $error['retryAfter'] = $this->retryAfter;
        }

        if ($this->meta !== []) {
            $error['meta'] = $this->meta;
        }

        if ($this->debug !== null) {
            $error['debug'] = $this->debug;
        }

        return ['error' => $error];
    }
}
