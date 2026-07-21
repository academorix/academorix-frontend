<?php

/**
 * @file packages/routing/src/Support/ApiVersionRegistry.php
 *
 * @description
 * Per-request scoped registry that holds the resolved API version
 * for the current HTTP cycle. Populated by
 * {@see \Stackra\Routing\Middleware\DetectApiVersion} on the
 * inbound side and consumed by:
 *
 *   - {@see \Stackra\Routing\Concerns\InteractsWithApiVersion}
 *     (controller helpers).
 *   - The response emitter (out of scope here) which reads the
 *     resolved version + Sunsets metadata to attach
 *     `X-API-Version`, `Sunset`, `Deprecation`, and
 *     `Link: rel="successor-version"` headers.
 *
 * ## Binding
 *
 * Bound in {@see \Stackra\Routing\Providers\ApiVersioningServiceProvider}
 * via Laravel's `scoped()` so each request / job gets its own
 * instance. `scoped()` (not `singleton()`) is deliberate — this
 * registry holds request-lifetime state and would leak between
 * requests on the same Octane worker if held as a singleton.
 *
 * ## Interface, not concrete
 *
 * We ship the concrete right here (no separate contract) because
 * the abstraction has exactly one shape in the wild. When a
 * second implementation appears (e.g. a distributed tracing
 * variant that reports the version to a span), promote the class
 * to an interface at that point rather than pre-emptively.
 *
 * @see \Stackra\Routing\Middleware\DetectApiVersion Populator.
 * @see \Stackra\Routing\Concerns\InteractsWithApiVersion Reader.
 */

declare(strict_types=1);

namespace Stackra\Routing\Support;

use Stackra\Routing\Attributes\Sunsets;
use Illuminate\Container\Attributes\Scoped;

/**
 * Holds the version + source + optional sunset metadata resolved
 * for the current request.
 *
 * The class is deliberately mutable — the middleware writes to it
 * once at the very start of the pipeline, and the emitter reads
 * it at the very end. Mutability is bounded to the request scope
 * and never survives it because `#[Scoped]` lifetime is one
 * request. A `#[Singleton]` would freeze the first request's
 * state onto every subsequent one on the same Octane worker.
 */
#[Scoped]
final class ApiVersionRegistry
{
    /**
     * Canonical version string resolved for this request, e.g.
     * `'v2'`. `null` when no version was resolvable AND no default
     * was configured — the middleware treats that as a hard
     * failure and never leaves the registry populated with `null`
     * for a versioned request. Concretely, `null` here means
     * "version-neutral endpoint" (see {@see markNeutral()}).
     */
    private ?string $version = null;

    /**
     * Where the version came from. Useful for observability and
     * for the response emitter deciding which echo header to use.
     *
     * @var 'header'|'query'|'accept'|'path'|'default'|'neutral'|null
     */
    private ?string $source = null;

    /**
     * Optional sunset metadata copied from the controller's
     * {@see Sunsets} attribute. The emitter reads this to attach
     * `Sunset` / `Deprecation` / `Link` headers. `null` when the
     * resolved route target didn't declare a sunset.
     */
    private ?Sunsets $sunsets = null;

    /**
     * `true` when the response emitter should attach `Deprecation`
     * headers even before the sunset date. Mirrors
     * {@see Sunsets::$warnOnAccess}; separated out so version-only
     * (non-sunset) deprecations can also be reported when we
     * grow that feature.
     */
    private bool $deprecated = false;

    /**
     * Record a resolved version and its source.
     *
     * @param  'header'|'query'|'accept'|'path'|'default'  $source
     */
    public function resolve(string $version, string $source): void
    {
        $this->version = $version;
        $this->source = $source;
    }

    /**
     * Record that the resolved route target opted out of
     * versioning via {@see \Stackra\Routing\Attributes\ApiVersionNeutral}.
     * Callers of {@see version()} will get `null` back — the
     * emitter interprets that as "attach no version headers".
     */
    public function markNeutral(): void
    {
        $this->version = null;
        $this->source = 'neutral';
        $this->sunsets = null;
        $this->deprecated = false;
    }

    /**
     * Store the sunset attribute matched against the resolved
     * route target. Called by the middleware AFTER version
     * resolution succeeds; the emitter reads this to attach
     * `Sunset` / `Link` headers.
     */
    public function attachSunsets(Sunsets $sunsets): void
    {
        $this->sunsets = $sunsets;

        // A Sunsets attribute with `warnOnAccess = true` (the
        // default) implies the emitter should attach a
        // Deprecation: true header on every response for this
        // endpoint. Capturing it here keeps the emitter's read
        // path branch-free.
        if ($sunsets->warnOnAccess) {
            $this->deprecated = true;
        }
    }

    /**
     * Force the deprecation flag independently of a Sunsets
     * attribute. Reserved for future use when we support
     * deprecation without an explicit sunset date (e.g. a
     * `#[Deprecated]` attribute on individual actions).
     */
    public function markDeprecated(bool $deprecated = true): void
    {
        $this->deprecated = $deprecated;
    }

    /** Resolved version or `null` for a neutral endpoint. */
    public function version(): ?string
    {
        return $this->version;
    }

    /**
     * Channel that supplied the version, or `null` before the
     * middleware runs. `'neutral'` when
     * {@see markNeutral()} was called.
     *
     * @return 'header'|'query'|'accept'|'path'|'default'|'neutral'|null
     */
    public function source(): ?string
    {
        return $this->source;
    }

    /**
     * The {@see Sunsets} attribute matched against the resolved
     * target, or `null` when the target has no sunset declared.
     */
    public function sunsets(): ?Sunsets
    {
        return $this->sunsets;
    }

    /**
     * Convenience — `true` when either {@see attachSunsets()} set
     * the flag or {@see markDeprecated()} was called manually.
     */
    public function isDeprecated(): bool
    {
        return $this->deprecated;
    }
}
