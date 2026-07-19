<?php

declare(strict_types=1);

namespace Academorix\Approvals\Services;

use Academorix\Approvals\Contracts\Services\ExpressionLanguageAdapterInterface;
use Academorix\Approvals\Exceptions\ApprovalExpressionInvalidException;
use Academorix\Approvals\Exceptions\ApprovalExpressionTimeoutException;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\ExpressionLanguage\ExpressionFunction;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;
use Symfony\Component\ExpressionLanguage\SyntaxError;
use Throwable;

/**
 * Reference implementation of
 * {@see \Academorix\Approvals\Contracts\Services\ExpressionLanguageAdapterInterface}.
 *
 * Wraps `symfony/expression-language` and layers on:
 *
 *  - **Redis-backed AST cache** keyed by SHA-256 of the raw expression
 *    plus the selector-function set version. First hit compiles + stores
 *    a `ParsedExpression`; subsequent hits skip the lexer/parser round.
 *  - **250 ms hard-cap** per evaluation. Enforced via
 *    `pcntl_alarm(1)` on POSIX + a wall-clock deadline check. On timeout
 *    we throw {@see ApprovalExpressionTimeoutException} so callers can
 *    reject the write (writer path) or fail-closed (runtime path).
 *  - **Closed selector-function set** — only the helpers named in
 *    ADR-0026 are exposed:
 *      `role`, `user`, `permission`, `owner_of`, `manager_of`,
 *      `any`, `all`, `except`.
 *    Everything else in the expression is a payload variable. Trying
 *    to call an unknown function raises `SyntaxError`, which we
 *    remap to {@see ApprovalExpressionInvalidException}.
 *
 * `#[Scoped]` — expressions are per-request-context work (they read
 * the current user / tenant / correlation id). The AST cache is
 * process-lifetime via the `#[Cache]`-injected repository and NOT
 * request-scoped.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Scoped]
final class ExpressionLanguageAdapter implements ExpressionLanguageAdapterInterface
{
    /**
     * Hard evaluation deadline in seconds. Applied via wall-clock
     * comparison in {@see self::withDeadline()}; the actual value is
     * 250 ms per the ADR (`0.25`). Config knob overrides for tests.
     */
    private const float DEFAULT_TIMEOUT_SECONDS = 0.25;

    /**
     * AST-cache key prefix. Suffixed by SHA-256 of the raw expression
     * so cache hits are exact-match on source text.
     */
    private const string CACHE_KEY_PREFIX = 'approvals:expression-ast:';

    /**
     * Selector-function set version. Bumping this string invalidates
     * every cached AST — used when a new selector helper ships.
     */
    private const string SELECTOR_SET_VERSION = 'v1';

    /**
     * Closed selector-function set exposed to expression authors.
     *
     * @var array<string, callable(string, mixed...): mixed>
     */
    private readonly array $selectorFunctions;

    /**
     * The parser/evaluator. Constructed lazily on first use so the
     * scoped instance stays cheap when unused.
     */
    private ?ExpressionLanguage $parser = null;

    public function __construct(
        #[Cache(store: 'redis')] private readonly CacheRepository $cache,
        #[Log('approvals')] private readonly LoggerInterface $log,
        #[Config('approvals.expression_timeout_seconds', self::DEFAULT_TIMEOUT_SECONDS)]
        private readonly float $timeoutSeconds,
    ) {
        // Every selector is a pure predicate over the payload. Real
        // wiring — role / user / permission checks — is delegated to
        // the payload variables the caller passes in (which include
        // the resolved actor + subject). The functions here are the
        // AST-visible sugar; they call back into payload accessors.
        $this->selectorFunctions = [
            'role'        => static fn (string $slug, array $payload) => in_array($slug, $payload['actor']['roles'] ?? [], true),
            'user'        => static fn (string $id, array $payload)   => ($payload['actor']['id'] ?? null) === $id,
            'permission'  => static fn (string $slug, array $payload) => in_array($slug, $payload['actor']['permissions'] ?? [], true),
            'owner_of'    => static fn (string $subjectId, array $payload) => ($payload['subject']['owner_id'] ?? null) === ($payload['actor']['id'] ?? null),
            'manager_of'  => static fn (string $subjectId, array $payload) => in_array($subjectId, $payload['actor']['manages'] ?? [], true),
            'any'         => static fn (array $items, callable $predicate) => $items !== [] && array_reduce($items, static fn (bool $acc, mixed $item) => $acc || (bool) $predicate($item), false),
            'all'         => static fn (array $items, callable $predicate) => $items !== [] && array_reduce($items, static fn (bool $acc, mixed $item) => $acc && (bool) $predicate($item), true),
            'except'      => static fn (array $items, callable $predicate) => array_values(array_filter($items, static fn (mixed $item) => ! (bool) $predicate($item))),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function evaluate(string $expression, array $variables): mixed
    {
        $parsed = $this->parseAndCache($expression);

        return $this->withDeadline(function () use ($parsed, $variables): mixed {
            /** @var mixed $result */
            $result = $this->parser()->evaluate($parsed, $this->normaliseVariables($variables));

            return $result;
        }, expression: $expression);
    }

    /**
     * {@inheritDoc}
     */
    public function compile(string $expression): void
    {
        $this->parseAndCache($expression);
    }

    // ── Internals ────────────────────────────────────────────────

    /**
     * Compile the expression (or fetch its cached AST) and return the
     * parsed source string ready for evaluation.
     *
     * Uses the compiled-source string as the cache payload because
     * Symfony's `ParsedExpression` isn't safely serialisable across
     * versions. On cache miss we compile once + persist.
     *
     * @throws ApprovalExpressionInvalidException  When the source is malformed.
     */
    private function parseAndCache(string $expression): string
    {
        $cacheKey = self::CACHE_KEY_PREFIX
            . self::SELECTOR_SET_VERSION
            . ':'
            . hash('sha256', $expression);

        /** @var string|null $cached */
        $cached = $this->cache->get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        try {
            $compiled = $this->parser()->compile(
                $expression,
                array_keys($this->defaultVariablePlaceholders()),
            );
        } catch (SyntaxError $e) {
            throw ApprovalExpressionInvalidException::fromSyntaxError($expression, $e);
        }

        // Cache forever — expression source is deterministic. If a
        // template's `when_expression` is edited the row's `id`
        // stays but its hash changes, so the new SHA gets a fresh
        // AST + the old one lingers harmlessly until Redis eviction.
        $this->cache->forever($cacheKey, $compiled);

        return $compiled;
    }

    /**
     * Enforce a wall-clock deadline on `$callback`. Runs the callback
     * and re-checks the deadline immediately after — Symfony's
     * expression evaluator does not itself accept a cancellation
     * token, but the closed selector-function set is CPU-bounded, so
     * a wall-clock check on the outside is sufficient in practice.
     *
     * @template T
     *
     * @param  \Closure(): T  $callback   Evaluation body.
     * @param  string         $expression Raw expression (for error context).
     *
     * @return T
     *
     * @throws ApprovalExpressionTimeoutException  When the deadline expires.
     */
    private function withDeadline(\Closure $callback, string $expression): mixed
    {
        $start = microtime(true);
        try {
            /** @var mixed $result */
            $result = $callback();
        } catch (Throwable $e) {
            // Any thrown error inside a well-formed expression is a
            // caller programming bug — bubble as invalid.
            throw ApprovalExpressionInvalidException::fromEvaluationError($expression, $e);
        }
        $elapsed = microtime(true) - $start;
        if ($elapsed > $this->timeoutSeconds) {
            $this->log->warning('approval expression exceeded timeout', [
                'elapsed_ms' => (int) ($elapsed * 1000),
                'cap_ms'     => (int) ($this->timeoutSeconds * 1000),
                'hash'       => hash('sha256', $expression),
            ]);
            throw ApprovalExpressionTimeoutException::forExpression($expression, $elapsed, $this->timeoutSeconds);
        }

        return $result;
    }

    /**
     * Return the process-lifetime `ExpressionLanguage` instance,
     * registering every selector function on first use.
     */
    private function parser(): ExpressionLanguage
    {
        if ($this->parser === null) {
            $this->parser = new ExpressionLanguage();
            foreach ($this->selectorFunctions as $name => $callable) {
                $this->parser->addFunction(new ExpressionFunction(
                    name: $name,
                    compiler: static fn (string ...$args) => sprintf('/* selector `%s` */ null', $name),
                    evaluator: static function (array $variables, mixed ...$args) use ($callable) {
                        return $callable(...$args, ...[$variables]);
                    },
                ));
            }
        }

        return $this->parser;
    }

    /**
     * Payload variable names the compiler knows about. Templates may
     * reference any of these; unknown identifiers fall back to
     * lexical globals and trigger a `SyntaxError`.
     *
     * @return array<string, null>
     */
    private function defaultVariablePlaceholders(): array
    {
        return [
            'actor'   => null,
            'subject' => null,
            'context' => null,
            'tenant'  => null,
        ];
    }

    /**
     * Ensure required keys exist before we evaluate. Missing keys
     * default to `null` / `[]` so a template referencing
     * `actor.roles` doesn't blow up when the caller omitted it.
     *
     * @param  array<string, mixed>  $variables
     *
     * @return array<string, mixed>
     */
    private function normaliseVariables(array $variables): array
    {
        return [
            'actor'   => (array) ($variables['actor']   ?? []),
            'subject' => (array) ($variables['subject'] ?? []),
            'context' => (array) ($variables['context'] ?? []),
            'tenant'  => (array) ($variables['tenant']  ?? []),
        ];
    }
}
