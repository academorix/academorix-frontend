<?php

/**
 * @file packages/sdk/api-sdk/src/Middleware/LogRequestMiddleware.php
 *
 * @description
 * Request + response logger. Emits structured log lines with
 * method, URL, status, duration, and redacted headers. Payloads
 * are never logged.
 *
 * ## Redaction
 *
 * Every header whose lower-cased name matches an entry in the
 * `sdk.api.logging.redact` list is replaced with `REDACTED`.
 * The default list covers `authorization`, `x-api-key`,
 * `cookie`, and common secret body keys. Consumers can extend
 * via config; new entries take effect at container boot.
 *
 * ## Log level mapping
 *
 *   - `Off`    → the middleware isn't wired at all (see
 *                `ApiConnector::__construct`). No overhead.
 *   - `Errors` → only failing requests (4xx / 5xx / thrown).
 *   - `All`    → every request, both success and failure.
 *
 * ## Duration measurement
 *
 * Duration is measured across the SEND, not the retry chain —
 * i.e. one log line per HTTP round-trip. Retried requests emit
 * multiple lines with the same correlation id.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Middleware;

use Stackra\ApiSdk\Enums\LogLevel;
use Psr\Log\LoggerInterface;
use Saloon\Http\Connector;
use Saloon\Http\PendingRequest;
use Saloon\Http\Response;

/**
 * Bi-directional middleware — captures start time on request,
 * logs duration + status on response.
 */
final class LogRequestMiddleware
{
    /**
     * Per-request start time, keyed by request object hash.
     * Cleared on response.
     *
     * @var array<string, float>
     */
    private static array $startTimes = [];

    /**
     * @param  LoggerInterface  $logger
     * @param  LogLevel         $level
     * @param  list<string>     $redact  Header + body keys to redact (case-insensitive).
     */
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly LogLevel $level,
        private readonly array $redact,
    ) {
    }

    /**
     * Wire the middleware — one request-side hook to capture
     * the start time, one response-side hook to emit the log
     * line.
     */
    public function register(Connector $connector): void
    {
        $connector->middleware()->onRequest(
            function (PendingRequest $pending): PendingRequest {
                $key = spl_object_hash($pending->getRequest());
                self::$startTimes[$key] = microtime(true);
                return $pending;
            },
            'log-request-start',
        );

        $connector->middleware()->onResponse(
            function (Response $response): Response {
                $this->log($response);
                return $response;
            },
            'log-request-end',
        );
    }

    /**
     * Emit the log line for a completed request.
     */
    private function log(Response $response): void
    {
        $status  = $response->status();
        $failure = $status >= 400;

        if ($this->level === LogLevel::Errors && ! $failure) {
            return;
        }

        $pending = $response->getPendingRequest();
        $request = $pending->getRequest();
        $key     = spl_object_hash($request);

        $durationMs = isset(self::$startTimes[$key])
            ? (int) round((microtime(true) - self::$startTimes[$key]) * 1000)
            : null;
        unset(self::$startTimes[$key]);

        $context = [
            'sdk.method'      => $request->getMethod()->value,
            'sdk.url'         => $pending->getUrl(),
            'sdk.status'      => $status,
            'sdk.duration_ms' => $durationMs,
            'sdk.headers'     => $this->redactHeaders($pending),
        ];

        $level  = $failure ? 'warning' : 'info';
        $prefix = $failure ? 'sdk request failed' : 'sdk request';

        $this->logger->log($level, "{$prefix} {$context['sdk.method']} {$context['sdk.url']}", $context);
    }

    /**
     * Return the request's headers with the redact list applied.
     *
     * @return array<string, string>
     */
    private function redactHeaders(PendingRequest $pending): array
    {
        $redactSet = array_flip(array_map('strtolower', $this->redact));
        $out       = [];

        foreach ($pending->headers()->all() as $name => $value) {
            $key   = strtolower((string) $name);
            $out[$name] = isset($redactSet[$key])
                ? 'REDACTED'
                : (is_array($value) ? implode(', ', $value) : (string) $value);
        }

        return $out;
    }
}
