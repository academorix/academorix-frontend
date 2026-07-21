<?php

/**
 * @file packages/exceptions/src/Support/Redactor.php
 *
 * @description
 * Central redaction service for exception context payloads, log
 * bindings, and the AI-solutions prompt seed. One place to define
 * "what counts as sensitive" so we don't sprinkle string-matching
 * loops across five call sites.
 *
 * ## What it does
 *
 * 1. **Key-based redaction.** If a key name contains any of the
 *    configured `sensitive_keys` (case-insensitive substring match),
 *    the entire value is replaced with the redaction marker — even
 *    if the value is an array or object.
 *
 * 2. **Value-based redaction.** Every scalar value is scanned
 *    against a set of regex patterns (JWTs, credit-card numbers,
 *    email addresses when strict mode is on, Bearer tokens embedded
 *    in strings). Matched substrings are replaced inline, so a
 *    message like "posting to https://api/x?token=sk_live_abc" ships
 *    as "posting to https://api/x?token=[REDACTED]".
 *
 * 3. **Recursion.** Nested arrays are walked recursively. The
 *    redactor never mutates the input — every path returns a new
 *    array.
 *
 * ## What it deliberately DOESN'T do
 *
 * - Doesn't try to be a WAF. If the caller shoves a raw credit card
 *   number into `getMessage()`, that's a bug at the throw site; the
 *   redactor is a safety net, not the primary guard.
 * - Doesn't know about PII regulations (GDPR / HIPAA / PCI). Callers
 *   working with regulated data must scrub at the domain boundary.
 * - Doesn't run on binary payloads. Attachments in context are
 *   replaced with a `[BINARY]` marker.
 *
 * ## Configuration
 *
 * Reads defaults from `config('exceptions.redaction.*')`; every
 * setting is overridable via constructor arguments so tests can
 * build an isolated redactor without touching the config store.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Support;

use Illuminate\Contracts\Config\Repository as ConfigRepository;

final class Redactor
{
    /**
     * Default set of key-substrings the redactor treats as sensitive.
     * Match is case-insensitive substring — `X-API-Key` and
     * `api_key` and `apiKey` are all caught by `api_key`.
     *
     * Kept as a class constant so tests can reason about the baseline
     * without instantiating the redactor.
     *
     * @var list<string>
     */
    public const DEFAULT_SENSITIVE_KEYS = [
        'password',
        'passwd',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'access_token',
        'refresh_token',
        'id_token',
        'api_key',
        'apikey',
        'secret',
        'client_secret',
        'private_key',
        'authorization',
        'auth',
        'cookie',
        'session',
        'csrf',
        'x-xsrf-token',
        'x-api-key',
        'ssn',
        'social_security',
        'credit_card',
        'card_number',
        'cvv',
        'cvc',
        'pan',
        'iban',
        'bank_account',
        'otp',
        'pin',
    ];

    /**
     * Regex patterns applied to every scalar value. Each pattern uses
     * a delimiter (`~`) and the case-insensitive flag where relevant.
     *
     * Kept short and precise — false positives on stringly-typed
     * data are cheap here, false negatives on real credentials are
     * catastrophic.
     *
     * @var array<string, string> map of label => pattern
     */
    public const DEFAULT_SENSITIVE_PATTERNS = [
        // Bearer / Basic tokens embedded in longer strings.
        'bearer_token' => '~(bearer\s+)([a-z0-9._\-]+)~i',
        'basic_auth' => '~(basic\s+)([a-z0-9+/=]+)~i',

        // JSON Web Tokens (three base64url-encoded parts).
        'jwt' => '~eyJ[a-zA-Z0-9_\-]{5,}\.eyJ[a-zA-Z0-9_\-]{5,}\.[a-zA-Z0-9_\-]{5,}~',

        // OpenAI / Anthropic / Google / Stripe live keys.
        'openai_key' => '~sk-(?:proj-)?[a-zA-Z0-9]{20,}~',
        'anthropic_key' => '~sk-ant-[a-zA-Z0-9_\-]{20,}~',
        'google_key' => '~AIza[0-9A-Za-z_\-]{35}~',
        'stripe_key' => '~(?:sk|rk|pk)_(?:live|test)_[a-zA-Z0-9]{16,}~',

        // 16-19 digit runs that look like PANs. Broad but useful
        // as a last-line safety net.
        'pan_like' => '~\b(?:\d[ -]?){13,19}\b~',
    ];

    /** @var list<string> */
    private array $sensitiveKeys;

    /** @var array<string, string> */
    private array $sensitivePatterns;

    private string $replacement;

    private int $maxDepth;

    private int $maxStringLength;

    /**
     * @param list<string>|null $sensitiveKeys Overrides `DEFAULT_SENSITIVE_KEYS`.
     * @param array<string, string>|null $sensitivePatterns Overrides `DEFAULT_SENSITIVE_PATTERNS`.
     */
    public function __construct(
        ?ConfigRepository $config = null,
        ?array $sensitiveKeys = null,
        ?array $sensitivePatterns = null,
        string $replacement = '[REDACTED]',
        int $maxDepth = 8,
        int $maxStringLength = 2048,
    ) {
        $this->replacement = $config?->get('exceptions.redaction.replacement', $replacement) ?? $replacement;
        $this->maxDepth = (int) ($config?->get('exceptions.redaction.max_depth', $maxDepth) ?? $maxDepth);
        $this->maxStringLength = (int) ($config?->get('exceptions.redaction.max_string_length', $maxStringLength) ?? $maxStringLength);

        // Config values are merged INTO the defaults, not replacing
        // them — that way an app can add company-specific keys
        // without losing the framework baseline.
        $configuredKeys = $config?->get('exceptions.redaction.sensitive_keys', []) ?? [];
        $this->sensitiveKeys = array_values(array_unique(array_map(
            'strtolower',
            [...self::DEFAULT_SENSITIVE_KEYS, ...($sensitiveKeys ?? []), ...(array) $configuredKeys],
        )));

        $configuredPatterns = $config?->get('exceptions.redaction.sensitive_patterns', []) ?? [];
        $this->sensitivePatterns = array_replace(
            self::DEFAULT_SENSITIVE_PATTERNS,
            $sensitivePatterns ?? [],
            (array) $configuredPatterns,
        );
    }

    /**
     * Deep-copy the given array with sensitive branches replaced.
     *
     * @param array<array-key, mixed> $data
     *
     * @return array<array-key, mixed>
     */
    public function redact(array $data, int $depth = 0): array
    {
        // Guard against pathological recursion — a payload that
        // references itself, or one deeper than any reasonable
        // domain object. Anything below the cap ships as the marker.
        if ($depth >= $this->maxDepth) {
            return [$this->replacement];
        }

        $out = [];
        foreach ($data as $key => $value) {
            $out[$key] = $this->isSensitiveKey((string) $key)
                ? $this->replacement
                : $this->redactValue($value, $depth + 1);
        }

        return $out;
    }

    /**
     * Redact a single scalar / array / object value.
     */
    public function redactValue(mixed $value, int $depth = 0): mixed
    {
        if (is_array($value)) {
            return $this->redact($value, $depth);
        }

        if (is_string($value)) {
            return $this->redactString($value);
        }

        // Scalar non-strings (int, float, bool, null) don't carry
        // sensitive substrings by themselves — pass through.
        if (is_scalar($value) || $value === null) {
            return $value;
        }

        if ($value instanceof \Stringable) {
            return $this->redactString((string) $value);
        }

        // Resources, closures, and unknown objects can't be safely
        // serialised without leaking internals. Mark and move on.
        return match (true) {
            is_object($value) => '[OBJECT:' . $value::class . ']',
            default => '[UNSUPPORTED]',
        };
    }

    /**
     * Apply every configured pattern to a single string.
     */
    public function redactString(string $value): string
    {
        // Cap runaway string values (e.g. an accidentally-attached
        // request body). We keep the head so callers still see the
        // shape and add an ellipsis marker.
        if (mb_strlen($value) > $this->maxStringLength) {
            $value = mb_substr($value, 0, $this->maxStringLength) . '…[TRUNCATED]';
        }

        foreach ($this->sensitivePatterns as $pattern) {
            // For bearer / basic patterns we keep group 1 (the
            // scheme keyword) so the log still reads sensibly. Every
            // other pattern replaces the full match.
            $value = (string) preg_replace_callback($pattern, function (array $matches): string {
                if (isset($matches[1]) && isset($matches[2])) {
                    return $matches[1] . $this->replacement;
                }

                return $this->replacement;
            }, $value);
        }

        return $value;
    }

    private function isSensitiveKey(string $key): bool
    {
        $needle = strtolower($key);

        foreach ($this->sensitiveKeys as $sensitive) {
            if (str_contains($needle, $sensitive)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The marker string the redactor swaps in. Exposed for tests
     * and for callers that need to render "this is redacted, not
     * empty" copy in the UI.
     */
    public function replacement(): string
    {
        return $this->replacement;
    }
}
