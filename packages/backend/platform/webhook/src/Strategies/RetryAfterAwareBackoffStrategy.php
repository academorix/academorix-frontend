<?php

declare(strict_types=1);

namespace Stackra\Webhook\Strategies;

use Stackra\Webhook\Models\WebhookSubscription;

/**
 * Retry-After-aware backoff.
 *
 * If the receiver's last response carried a `Retry-After` header
 * (either an integer number of seconds OR an HTTP-date), respects
 * that value. Falls back to
 * {@see StaticArrayBackoffStrategy} when the header is absent or
 * unparseable.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class RetryAfterAwareBackoffStrategy
{
    public function __construct(
        private readonly StaticArrayBackoffStrategy $fallback = new StaticArrayBackoffStrategy(),
    ) {
    }

    /**
     * Compute the delay (seconds) until the next retry.
     *
     * @param  array<string, mixed>  $lastResponse  Snapshot of the failing response.
     */
    public function resolve(
        WebhookSubscription $subscription,
        int $attempt,
        array $lastResponse,
    ): int {
        $headers = isset($lastResponse['response_headers']) && \is_array($lastResponse['response_headers'])
            ? $lastResponse['response_headers']
            : [];

        $retryAfter = $this->extractRetryAfter($headers);
        if ($retryAfter !== null) {
            return \max(0, $retryAfter);
        }

        return $this->fallback->resolve($subscription, $attempt);
    }

    /**
     * Parse the `Retry-After` header value into seconds.
     *
     * Accepts either an integer count of seconds OR an HTTP-date the
     * receiver wants us to wait until.
     *
     * @param  array<string, mixed>  $headers
     */
    private function extractRetryAfter(array $headers): ?int
    {
        // HTTP headers are case-insensitive — normalise once.
        $lower = [];
        foreach ($headers as $name => $value) {
            $lower[\strtolower((string) $name)] = $value;
        }

        if (! isset($lower['retry-after'])) {
            return null;
        }

        $raw = $lower['retry-after'];
        if (\is_array($raw)) {
            $raw = $raw[0] ?? null;
        }

        if (! \is_scalar($raw)) {
            return null;
        }

        $string = (string) $raw;
        if (\ctype_digit($string)) {
            return (int) $string;
        }

        $timestamp = \strtotime($string);
        if ($timestamp === false) {
            return null;
        }

        return \max(0, $timestamp - \time());
    }
}
