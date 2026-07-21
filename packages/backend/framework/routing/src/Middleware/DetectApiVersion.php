<?php

/**
 * @file packages/routing/src/Middleware/DetectApiVersion.php
 *
 * @description
 * Request-scoped middleware that resolves the API version for the
 * current call and stamps it onto the
 * {@see \Stackra\Routing\Support\ApiVersionRegistry}. Runs
 * BEFORE controller resolution so the resolved version is visible
 * to concerns / traits inside the controller method.
 *
 * ## Resolution order
 *
 * The middleware walks each configured strategy in order and stops
 * at the first hit:
 *
 *   1. `header` → `X-API-Version: v2`
 *   2. `accept` → `Accept: application/vnd.api+json; version=v2`
 *   3. `query`  → `?api_version=v2`
 *   4. `path`   → the `{version}` route parameter (from a
 *                  `/api/v{version}/...` prefix)
 *   5. `default` → fallback from
 *                   `config('api-versioning.default_version')`
 *
 * ## Enforcement
 *
 * Once a version is resolved, the middleware:
 *
 *   1. Resolves the target controller + method via the route's
 *      `getAction()` metadata.
 *   2. Reads {@see \Stackra\Routing\Attributes\ApiVersionNeutral}
 *      → short-circuits with `neutral` if present.
 *   3. Reads {@see \Stackra\Routing\Attributes\MapToApiVersion}
 *      (method-level) or {@see \Stackra\Routing\Attributes\ApiVersion}
 *      (class-level, fallback) → builds the effective allowlist.
 *   4. Verifies the resolved version is in the allowlist. Otherwise
 *      throws {@see UnsupportedApiVersionException}.
 *   5. Reads {@see \Stackra\Routing\Attributes\Sunsets} → if
 *      present, records it on the registry so the response
 *      emitter can attach `Sunset` / `Link` headers. When
 *      enforcement is enabled AND the sunset date has passed,
 *      throws {@see SunsetApiVersionException}.
 *
 * ## Octane safety
 *
 *   - No mutable state on the middleware instance itself. The
 *     comparator + registry are injected; the registry is
 *     `scoped()` in the container so it isolates per-request.
 *   - No use of `env()` — configuration is read via the injected
 *     `array $config` payload at boot time.
 *   - No captured Request references — every request reaches
 *     `handle()` explicitly.
 *
 * @see \Stackra\Routing\Providers\ApiVersioningServiceProvider
 *      Wires the middleware alias `api.version` and binds this
 *      class with its config payload.
 */

declare(strict_types=1);

namespace Stackra\Routing\Middleware;

use Stackra\Routing\Attributes\ApiVersion;
use Stackra\Routing\Attributes\ApiVersionNeutral;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Routing\Attributes\MapToApiVersion;
use Stackra\Routing\Attributes\Sunsets;
use Stackra\Routing\Http\Exceptions\MalformedApiVersionException;
use Stackra\Routing\Http\Exceptions\SunsetApiVersionException;
use Stackra\Routing\Http\Exceptions\UnsupportedApiVersionException;
use Stackra\Routing\Services\VersionComparator;
use Stackra\Routing\Support\ApiVersionRegistry;
use Closure;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use InvalidArgumentException;
use ReflectionClass;
use ReflectionMethod;
use Symfony\Component\HttpFoundation\Response;

/**
 * Detect the request's API version, validate it against the
 * resolved route target's attributes, and populate the registry.
 *
 * The `#[AsMiddleware]` attribute registers this class under the
 * `api.version` alias so routes can attach it via
 * `->middleware('api.version')` or the `#[Middleware('api.version')]`
 * attribute on a controller. `groups: []` keeps the middleware
 * opt-in — apps decide which route groups need version negotiation.
 *
 * @final
 */
#[AsMiddleware(alias: 'api.version', groups: [], priority: 50)]
final class DetectApiVersion
{
    /**
     * In-process cache of attribute reads, keyed by
     * `"{class}::{method}"`. Attributes are class metadata and
     * cannot change at runtime, so caching the extracted
     * allowlists / neutrality / sunsets is safe forever inside a
     * worker.
     *
     * Static-property caches are Octane-safe here because the
     * cached values are pure functions of immutable class
     * metadata. Under Octane the cache warms up on first hit and
     * is reused across every subsequent request in the worker.
     *
     * @var array<string, array{
     *     neutral: bool,
     *     versions: list<string>,
     *     sunsets: Sunsets|null,
     * }>
     */
    private static array $attributeCache = [];

    /**
     * @param  ApiVersionRegistry                  $registry    Scoped
     *                                                          per-request
     *                                                          store the
     *                                                          middleware
     *                                                          writes into.
     * @param  VersionComparator                   $comparator  Stateless comparison
     *                                                          logic; injected so
     *                                                          test doubles can be
     *                                                          used.
     * @param  array{
     *             strategies: list<'header'|'accept'|'query'|'path'>,
     *             default_version: string,
     *             header_name: string,
     *             query_key: string,
     *             path_parameter: string,
     *             accept_pattern: string,
     *             enforce_sunsets: bool,
     *         }                                    $config      Config payload
     *                                                          copied verbatim from
     *                                                          `config('api-versioning')`
     *                                                          at boot; kept as an
     *                                                          array so the
     *                                                          middleware never
     *                                                          reaches back into
     *                                                          the container /
     *                                                          config store during
     *                                                          the hot path.
     */
    public function __construct(
        private readonly ApiVersionRegistry $registry,
        private readonly VersionComparator $comparator,
        #[Config('api-versioning', [])]
        private readonly array $config,
    ) {
    }

    /**
     * Laravel middleware entry point. Runs each strategy in order,
     * validates the resolved version against the route target's
     * attribute metadata, then delegates to the rest of the
     * pipeline.
     *
     * @throws MalformedApiVersionException   Version string unparseable.
     * @throws UnsupportedApiVersionException Version not on the allowlist.
     * @throws SunsetApiVersionException      Endpoint retired and enforcement enabled.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Pull the (class, method) tuple for the resolved route
        // target. If the route hasn't been resolved yet (which
        // shouldn't happen inside the middleware pipeline but is
        // theoretically possible with route caching corner cases),
        // skip attribute enforcement entirely — we can't check
        // against attributes we can't read.
        $target = $this->resolveTarget($request);

        // Attribute-level short-circuit: version-neutral endpoints
        // don't participate in negotiation at all.
        if ($target !== null) {
            $meta = $this->readAttributes($target[0], $target[1]);

            if ($meta['neutral']) {
                $this->registry->markNeutral();

                return $next($request);
            }
        } else {
            $meta = ['neutral' => false, 'versions' => [], 'sunsets' => null];
        }

        // Discover the version from the configured strategies.
        [$resolved, $source] = $this->detectVersion($request);

        // Validate the version STRING SHAPE — throws
        // MalformedApiVersionException with source metadata
        // baked in. VersionComparator::parse() does the actual
        // regex check; we surface the domain exception here.
        try {
            $this->comparator->parse($resolved);
        } catch (InvalidArgumentException) {
            throw MalformedApiVersionException::forRaw($resolved, $source);
        }

        // Check against the allowlist (if we have route target
        // metadata). Without attribute metadata every version
        // that parses is accepted — this is the legacy path
        // for unversioned controllers.
        if ($meta['versions'] !== [] && ! $this->comparator->isOneOf($resolved, $meta['versions'])) {
            throw UnsupportedApiVersionException::forRequested(
                $resolved,
                $meta['versions'],
                $source,
            );
        }

        // Populate registry so the emitter + concerns can read it.
        $this->registry->resolve($resolved, $source);

        // Sunset handling: attach metadata to the registry so the
        // emitter can build the `Sunset` / `Link` headers, and
        // (optionally) enforce the removal date.
        if ($meta['sunsets'] !== null) {
            $this->registry->attachSunsets($meta['sunsets']);

            if ($this->config['enforce_sunsets'] && $meta['sunsets']->hasPassed($this->now())) {
                throw SunsetApiVersionException::forRequested(
                    $resolved,
                    $meta['sunsets']->date->format('Y-m-d'),
                    $meta['sunsets']->replacedBy,
                );
            }
        }

        return $next($request);
    }

    // -----------------------------------------------------------------
    // Resolution — walk configured strategies in order.
    // -----------------------------------------------------------------

    /**
     * Iterate the configured strategy list and return the first
     * hit. Falls back to the configured default when nothing
     * matches. The returned tuple is `[version, source]`, both
     * always non-empty strings.
     *
     * @return array{0: string, 1: 'header'|'accept'|'query'|'path'|'default'}
     */
    private function detectVersion(Request $request): array
    {
        foreach ($this->config['strategies'] as $strategy) {
            $value = match ($strategy) {
                'header' => $this->fromHeader($request),
                'accept' => $this->fromAccept($request),
                'query' => $this->fromQuery($request),
                'path' => $this->fromPath($request),
                default => null,
            };

            if (is_string($value) && $value !== '') {
                return [$value, $strategy];
            }
        }

        return [$this->config['default_version'], 'default'];
    }

    /**
     * Read the raw `X-API-Version` header (or whatever custom
     * header name the app configured).
     */
    private function fromHeader(Request $request): ?string
    {
        $raw = $request->headers->get($this->config['header_name']);

        return is_string($raw) && $raw !== '' ? trim($raw) : null;
    }

    /**
     * Extract the version param from a media-type Accept header.
     * Matches values like:
     *
     *     application/vnd.api+json; version=v2
     *     application/vnd.acme.v3+json
     *
     * against the configured `accept_pattern` (a full PCRE regex
     * with a single capturing group for the version literal).
     */
    private function fromAccept(Request $request): ?string
    {
        $accept = $request->headers->get('Accept');

        if (! is_string($accept) || $accept === '') {
            return null;
        }

        if (preg_match($this->config['accept_pattern'], $accept, $matches) !== 1) {
            return null;
        }

        $captured = $matches[1] ?? null;

        return is_string($captured) && $captured !== '' ? trim($captured) : null;
    }

    /**
     * Read `?api_version=vN` (key configurable).
     */
    private function fromQuery(Request $request): ?string
    {
        $raw = $request->query->get($this->config['query_key']);

        return is_string($raw) && $raw !== '' ? trim($raw) : null;
    }

    /**
     * Read the `{version}` (or configured name) route parameter,
     * captured from a `/api/v{version}/...` style prefix.
     */
    private function fromPath(Request $request): ?string
    {
        $route = $request->route();

        if ($route === null) {
            return null;
        }

        $raw = $route->parameter($this->config['path_parameter']);

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        // Path parameters are commonly captured without the leading
        // `v`, so normalise so the comparator sees the same input
        // as the other channels.
        return str_starts_with($raw, 'v') || str_starts_with($raw, 'V')
            ? trim($raw)
            : 'v' . trim($raw);
    }

    // -----------------------------------------------------------------
    // Attribute reading — cached per class/method tuple.
    // -----------------------------------------------------------------

    /**
     * Return the resolved route's controller class + method, or
     * `null` when the route doesn't map to a class-based action
     * (closure routes, redirects, view routes).
     *
     * @return array{0: class-string, 1: string}|null
     */
    private function resolveTarget(Request $request): ?array
    {
        $route = $request->route();

        if ($route === null) {
            return null;
        }

        $action = $route->getAction('uses');

        // Class@method string form: `App\Http\Controllers\Foo@bar`.
        if (is_string($action) && str_contains($action, '@')) {
            [$class, $method] = explode('@', $action, 2);

            // @phpstan-ignore-next-line — the string comes from a
            // trusted routing source; type is class-string in practice.
            return class_exists($class) ? [$class, $method] : null;
        }

        // Invokable / array form: [ClassName::class, 'method'].
        if (is_array($action) && count($action) === 2) {
            [$class, $method] = $action;

            if (is_string($class) && is_string($method) && class_exists($class)) {
                // @phpstan-ignore-next-line — see above.
                return [$class, $method];
            }
        }

        return null;
    }

    /**
     * Extract the versioning-relevant attribute metadata for a
     * (class, method) tuple, memoising the result. Precedence:
     *
     *   - `ApiVersionNeutral` anywhere → `neutral = true`, stop.
     *   - `MapToApiVersion` on method → allowlist = method's list.
     *   - Otherwise, `ApiVersion` on method (repeated / merged) →
     *     allowlist = method's list.
     *   - Otherwise, `ApiVersion` on class → allowlist = class list.
     *   - No attributes → allowlist = [] (legacy / unversioned).
     *
     * `Sunsets` prefers method-level; class-level is the fallback.
     *
     * @param  class-string  $class
     * @return array{neutral: bool, versions: list<string>, sunsets: Sunsets|null}
     */
    private function readAttributes(string $class, string $method): array
    {
        $key = $class . '::' . $method;

        if (isset(self::$attributeCache[$key])) {
            return self::$attributeCache[$key];
        }

        // Guard against phantom method names (route caching or
        // manual action overrides) — reflection on a non-existent
        // method would throw. Treat as no metadata.
        if (! method_exists($class, $method)) {
            return self::$attributeCache[$key] = [
                'neutral' => false,
                'versions' => [],
                'sunsets' => null,
            ];
        }

        $refClass = new ReflectionClass($class);
        $refMethod = new ReflectionMethod($class, $method);

        $neutral = $refClass->getAttributes(ApiVersionNeutral::class) !== []
            || $refMethod->getAttributes(ApiVersionNeutral::class) !== [];

        if ($neutral) {
            return self::$attributeCache[$key] = [
                'neutral' => true,
                'versions' => [],
                'sunsets' => null,
            ];
        }

        $versions = $this->readVersions($refClass, $refMethod);
        $sunsets = $this->readSunsets($refClass, $refMethod);

        return self::$attributeCache[$key] = [
            'neutral' => false,
            'versions' => $versions,
            'sunsets' => $sunsets,
        ];
    }

    /**
     * Build the effective version allowlist for a resolved target.
     *
     * @return list<string>
     */
    private function readVersions(ReflectionClass $class, ReflectionMethod $method): array
    {
        // Method-level MapToApiVersion wins outright.
        $mapAttrs = $method->getAttributes(MapToApiVersion::class);
        if ($mapAttrs !== []) {
            return $this->flatten(array_map(
                static fn ($attr): array => $attr->newInstance()->versions,
                $mapAttrs,
            ));
        }

        // Method-level ApiVersion narrows the class-level one.
        $methodApiVersions = $method->getAttributes(ApiVersion::class);
        if ($methodApiVersions !== []) {
            return $this->flatten(array_map(
                static fn ($attr): array => $attr->newInstance()->versions,
                $methodApiVersions,
            ));
        }

        // Class-level ApiVersion is the fallback.
        $classApiVersions = $class->getAttributes(ApiVersion::class);
        if ($classApiVersions !== []) {
            return $this->flatten(array_map(
                static fn ($attr): array => $attr->newInstance()->versions,
                $classApiVersions,
            ));
        }

        return [];
    }

    /**
     * Prefer method-level `#[Sunsets]`; fall back to class-level.
     * Only one instance is ever active per target — the attribute
     * itself is NOT `IS_REPEATABLE`.
     */
    private function readSunsets(ReflectionClass $class, ReflectionMethod $method): ?Sunsets
    {
        $methodSunsets = $method->getAttributes(Sunsets::class);
        if ($methodSunsets !== []) {
            $instance = $methodSunsets[0]->newInstance();

            return $instance instanceof Sunsets ? $instance : null;
        }

        $classSunsets = $class->getAttributes(Sunsets::class);
        if ($classSunsets !== []) {
            $instance = $classSunsets[0]->newInstance();

            return $instance instanceof Sunsets ? $instance : null;
        }

        return null;
    }

    /**
     * Flatten a list of lists to a single list<string>, preserving
     * order and removing duplicates.
     *
     * @param  list<list<string>>  $lists
     * @return list<string>
     */
    private function flatten(array $lists): array
    {
        $out = [];
        foreach ($lists as $list) {
            foreach ($list as $entry) {
                if (! in_array($entry, $out, true)) {
                    $out[] = $entry;
                }
            }
        }

        return $out;
    }

    /**
     * Isolated "current time" hook so tests can substitute a fake
     * clock via subclassing / test doubling. Uses UTC to match the
     * midnight-UTC normalisation on the {@see Sunsets} attribute.
     */
    private function now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('UTC'));
    }
}
