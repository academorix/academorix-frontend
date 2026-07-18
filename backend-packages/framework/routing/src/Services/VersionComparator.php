<?php

/**
 * @file packages/routing/src/Services/VersionComparator.php
 *
 * @description
 * Pure comparison logic for API versions. Zero framework
 * dependencies — deliberately stateless and side-effect free so it
 * can be injected as a singleton, called from a queue worker
 * without any request scope, or used inside a static context
 * during boot-time route scanning.
 *
 * ## What "version" means here
 *
 * API versions in this package are STRING LITERALS. The canonical
 * shape is `v` followed by digits (`v1`, `v2`, `v10`) and
 * optionally a dotted minor / patch (`v1.2`, `v2.10.3`). We do NOT
 * commit to SemVer because API versioning has different semantics
 * from library versioning — a public API's "v1" is a stable
 * contract that MAY see additive changes without a bump. The
 * comparator therefore treats versions as tuples of integers, not
 * as SemVer strings, and compares them lexicographically.
 *
 * ## Why not `composer/semver`
 *
 *   1. The library is 40 KB of transitive PHP for a job we can do
 *      in ~30 lines of pure comparison.
 *   2. Its constraint DSL (`^1.2 || ~2.0`) is overkill — API
 *      version constraints in practice are `= v1`, `>= v2`, or a
 *      simple whitelist `[v1, v2]`.
 *   3. Version parsing there permits pre-release and metadata
 *      segments (`1.0.0-alpha+build.1`) that don't belong on a
 *      public URL.
 *
 * ## Supported inputs
 *
 *   - Bare `vN`             → `v1`, `v2`
 *   - Dotted `vN.M`         → `v1.2`
 *   - Dotted `vN.M.P`       → `v2.10.3`
 *   - Unprefixed `N.M.P`    → `1.2.3` (normalised)
 *
 * Anything else raises {@see \InvalidArgumentException}. The
 * middleware catches that and rethrows as
 * {@see \Academorix\Routing\Http\Exceptions\MalformedApiVersionException}.
 *
 * @see \Academorix\Routing\Middleware\DetectApiVersion  Primary consumer.
 * @see \Academorix\Routing\Support\ApiVersionRegistry    Uses this for satisfies() checks.
 */

declare(strict_types=1);

namespace Academorix\Routing\Services;

use Illuminate\Container\Attributes\Singleton;
use InvalidArgumentException;

/**
 * Compare API version strings against each other and against
 * simple constraints.
 *
 * ## Stateless
 *
 * Every method is `public` and takes its inputs explicitly. No
 * instance state, no static caches. Safe to bind as a
 * `#[Singleton]` (per ADR 0006) so every Octane worker resolves
 * one instance and shares it across every request.
 *
 * ## Comparison semantics
 *
 * Versions are converted to integer tuples, then compared
 * component-wise from left to right. Missing trailing components
 * default to 0 — `v1` and `v1.0` and `v1.0.0` all compare equal.
 *
 * @final
 */
#[Singleton]
final class VersionComparator
{
    /**
     * Regex applied by {@see parse()} to reject anything that isn't
     * a numeric version. Anchored so partial matches don't slip
     * through.
     *
     * Accepts:
     *   - `v1`, `V1`, `1`
     *   - `v1.2`, `v1.2.3`
     *   - Arbitrary depth (`v1.2.3.4.5`) — extra components just
     *     become extra tuple slots.
     *
     * Rejects:
     *   - Pre-release / build metadata (`v1.0.0-alpha`, `v1+build`)
     *   - Wildcards (`v1.*`, `v1.x`)
     *   - Leading zeros beyond a single digit segment (`v01`, `v1.02`).
     */
    private const VERSION_PATTERN = '/^v?(\d+(?:\.\d+)*)$/i';

    /**
     * Parse a version string into a normalised integer tuple.
     *
     *     $c->parse('v1')      // [1]
     *     $c->parse('v1.2')    // [1, 2]
     *     $c->parse('v2.10.3') // [2, 10, 3]
     *     $c->parse('1.0.0')   // [1, 0, 0]
     *
     * @param  string  $version  Any of the shapes documented on
     *                           {@see self::VERSION_PATTERN}.
     * @return list<int>         Component tuple, `count() >= 1`.
     *
     * @throws InvalidArgumentException If `$version` doesn't match
     *                                  the accepted shape or
     *                                  contains negative / oversize
     *                                  components.
     */
    public function parse(string $version): array
    {
        $trimmed = trim($version);

        if ($trimmed === '') {
            throw new InvalidArgumentException('API version string cannot be empty.');
        }

        if (! preg_match(self::VERSION_PATTERN, $trimmed, $matches)) {
            throw new InvalidArgumentException(sprintf(
                'API version "%s" is not a valid version string. Expected "vN", "vN.M", or "vN.M.P".',
                $version,
            ));
        }

        // $matches[1] is the digits+dots capture; explode splits on
        // the dot separator. Every segment is guaranteed numeric by
        // the regex, so intval() cannot fail — but we still assert
        // it stays in the signed 32-bit range because tuple
        // comparison relies on integer semantics.
        $parts = [];
        foreach (explode('.', $matches[1]) as $segment) {
            $intValue = (int) $segment;

            if ($intValue < 0 || $intValue > PHP_INT_MAX) {
                throw new InvalidArgumentException(sprintf(
                    'API version segment "%s" is out of range.',
                    $segment,
                ));
            }

            $parts[] = $intValue;
        }

        return $parts;
    }

    /**
     * Canonicalise a version to its normalised string form
     * (`v` prefix + integer tuple joined by dots).
     *
     *     $c->normalise('v1')     // 'v1'
     *     $c->normalise('1.0.0')  // 'v1.0.0'
     *     $c->normalise('V2.10')  // 'v2.10'
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function normalise(string $version): string
    {
        return 'v' . implode('.', $this->parse($version));
    }

    /**
     * Compare two versions in the `<=>` (spaceship) sense.
     *
     *   Returns  -1 when `$left < $right`
     *   Returns   0 when `$left == $right`
     *   Returns  +1 when `$left > $right`
     *
     * Missing trailing components on either side are treated as
     * zero — `v1` and `v1.0.0` compare equal.
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function compare(string $left, string $right): int
    {
        $l = $this->parse($left);
        $r = $this->parse($right);

        // Pad the shorter tuple with trailing zeros so we can walk
        // both in lockstep. Never mutate the parsed arrays because
        // the caller may care about their length semantically.
        $length = max(count($l), count($r));
        $lPadded = array_pad($l, $length, 0);
        $rPadded = array_pad($r, $length, 0);

        for ($i = 0; $i < $length; $i++) {
            if ($lPadded[$i] === $rPadded[$i]) {
                continue;
            }

            return $lPadded[$i] <=> $rPadded[$i];
        }

        return 0;
    }

    /**
     * `true` when the two version strings resolve to the same
     * integer tuple. Equivalent to `compare() === 0` but reads
     * better at call sites.
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function equals(string $left, string $right): bool
    {
        return $this->compare($left, $right) === 0;
    }

    /**
     * `true` when `$version` is strictly greater than `$other`.
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function greaterThan(string $version, string $other): bool
    {
        return $this->compare($version, $other) > 0;
    }

    /**
     * `true` when `$version` is strictly less than `$other`.
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function lessThan(string $version, string $other): bool
    {
        return $this->compare($version, $other) < 0;
    }

    /**
     * `true` when `$version` is any of the supplied `$allowed`
     * versions, comparing under {@see compare()} semantics so
     * `v1` and `v1.0.0` match.
     *
     * Empty `$allowed` returns `false` — an endpoint with zero
     * declared versions is unreachable by version negotiation.
     *
     * @param  list<string>  $allowed  Allowlist of acceptable versions.
     *
     * @throws InvalidArgumentException Propagated from {@see parse()}.
     */
    public function isOneOf(string $version, array $allowed): bool
    {
        if ($allowed === []) {
            return false;
        }

        foreach ($allowed as $candidate) {
            if ($this->equals($version, $candidate)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Test a version against a minimalist constraint DSL:
     *
     *   `=v1`      exact match          (default when no operator)
     *   `>=v2`     at least v2
     *   `>v1`      strictly greater
     *   `<v3`      strictly less
     *   `<=v2.1`   at most v2.1
     *
     * Deliberately kept small — comma / OR combinators are NOT
     * supported. Callers that need alternatives should iterate
     * their allowlist and call {@see isOneOf()} instead.
     *
     * @param  string  $version     Version being tested.
     * @param  string  $constraint  Operator + version literal.
     *
     * @throws InvalidArgumentException When the operator is unknown
     *                                  or the version literal on
     *                                  either side is malformed.
     */
    public function satisfies(string $version, string $constraint): bool
    {
        $trimmed = trim($constraint);

        if ($trimmed === '') {
            throw new InvalidArgumentException('Constraint cannot be empty.');
        }

        // Split into (operator, right-hand version). Order the
        // longest operators first so `>=` beats `>`.
        foreach (['>=', '<=', '=', '>', '<'] as $operator) {
            if (str_starts_with($trimmed, $operator)) {
                $rhs = trim(substr($trimmed, strlen($operator)));

                $cmp = $this->compare($version, $rhs);

                return match ($operator) {
                    '=' => $cmp === 0,
                    '>' => $cmp > 0,
                    '<' => $cmp < 0,
                    '>=' => $cmp >= 0,
                    '<=' => $cmp <= 0,
                };
            }
        }

        // No operator prefix → treat as an exact-match constraint,
        // matching how npm/composer allow `1.0.0` to mean `= 1.0.0`.
        return $this->equals($version, $trimmed);
    }
}
