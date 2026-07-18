<?php

/**
 * @file packages/foundation/src/Support/CorrelationId.php
 *
 * @description
 * Static accessor for the current-request correlation id (a.k.a.
 * request id / trace id). The id is minted or read by
 * {@see \Academorix\Foundation\Http\Middleware\AssignCorrelationId} and
 * exposed here so code deep in the call stack — exceptions, log
 * processors, queued jobs — can read it without hauling a `Request`
 * dependency around.
 *
 * Storage is per-request via `Container::instance()` binding. Queued
 * jobs and console commands can inject a correlation id manually via
 * `CorrelationId::set(...)` at the top of their handler.
 *
 * The id format is a 26-char ULID; consumers that receive an inbound
 * `X-Request-Id` header keep whatever the caller sent (up to 128
 * chars, alphanumeric + dashes) so distributed traces stay stitched.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Support;

use Illuminate\Support\Str;

final class CorrelationId
{
    /**
     * HTTP header this id travels on inbound + outbound.
     *
     * `X-Request-Id` is the de-facto standard (nginx `$request_id`,
     * AWS ALB, Cloudflare all use it). We also accept `X-Correlation-Id`
     * on inbound as a fallback for legacy clients.
     */
    public const HEADER = 'X-Request-Id';

    public const HEADER_FALLBACK = 'X-Correlation-Id';

    private static ?string $current = null;

    public static function current(): ?string
    {
        return self::$current;
    }

    public static function set(?string $id): void
    {
        self::$current = $id;
    }

    /**
     * Generate a fresh id. ULIDs sort lexicographically by time so
     * they play nicely with log storage that indexes by string.
     */
    public static function generate(): string
    {
        return (string) Str::ulid();
    }

    /**
     * Reset — used by tests between cases. Never call from app code.
     */
    public static function forget(): void
    {
        self::$current = null;
    }
}
