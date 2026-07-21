<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Services;

/**
 * Contract every version-scheme adapter implements.
 *
 * A scheme knows how to compare two version strings, match a version
 * against a constraint (wildcard / range), and parse a version into
 * its constituent parts. Selected per-ApiVersion via the `scheme`
 * column and dispatched through
 * {@see VersionSchemeRegistryInterface::resolve()}.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
interface VersionSchemeInterface
{
    /**
     * Compare two version strings. Returns -1, 0, or 1 matching
     * `spaceship <=>` semantics.
     *
     * @param  string  $a  Left operand.
     * @param  string  $b  Right operand.
     * @return int -1 when `$a < $b`, 0 when equal, 1 when `$a > $b`.
     */
    public function compare(string $a, string $b): int;

    /**
     * Whether `$version` satisfies `$constraint`. The constraint
     * syntax is scheme-specific — SemVer accepts `^1.0`, `~1.2`, and
     * pinned versions; CalVer accepts pinned versions only.
     */
    public function matches(string $version, string $constraint): bool;

    /**
     * Parse a version string into its parts. The shape is scheme-
     * specific — SemVer returns `major`/`minor`/`patch`, CalVer
     * returns `year`/`month`/`day`.
     *
     * @return array<string, int|string>
     */
    public function parse(string $version): array;
}
