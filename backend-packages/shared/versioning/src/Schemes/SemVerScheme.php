<?php

declare(strict_types=1);

namespace Academorix\Versioning\Schemes;

use Academorix\Versioning\Contracts\Services\VersionSchemeInterface;

/**
 * Standard SemVer implementation of {@see VersionSchemeInterface}.
 *
 * Uses `composer/semver` for comparison + constraint matching when
 * available; falls back to native `version_compare()` when the
 * composer package isn't installed. Accepts leading `v` — `v1.2.3`
 * and `1.2.3` compare equal.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class SemVerScheme implements VersionSchemeInterface
{
    /**
     * Compare two SemVer strings.
     */
    public function compare(string $a, string $b): int
    {
        $normalisedA = $this->stripLeadingV($a);
        $normalisedB = $this->stripLeadingV($b);

        if (\class_exists(\Composer\Semver\Comparator::class)) {
            if (\Composer\Semver\Comparator::lessThan($normalisedA, $normalisedB)) {
                return -1;
            }
            if (\Composer\Semver\Comparator::greaterThan($normalisedA, $normalisedB)) {
                return 1;
            }

            return 0;
        }

        return \version_compare($normalisedA, $normalisedB);
    }

    /**
     * Whether a SemVer string satisfies a constraint.
     *
     * When `composer/semver` is available, the full constraint syntax
     * is supported (`^1.0`, `~1.2`, `>=1.0 <2.0`). Otherwise falls
     * back to an equality check.
     */
    public function matches(string $version, string $constraint): bool
    {
        $normalisedVersion = $this->stripLeadingV($version);

        if (\class_exists(\Composer\Semver\Semver::class)) {
            return \Composer\Semver\Semver::satisfies($normalisedVersion, $constraint);
        }

        return $this->stripLeadingV($constraint) === $normalisedVersion;
    }

    /**
     * Parse a SemVer string into `major`, `minor`, `patch`.
     *
     * @return array<string, int|string>
     */
    public function parse(string $version): array
    {
        $normalised = $this->stripLeadingV($version);
        $parts      = \explode('.', $normalised);

        return [
            'major' => (int) ($parts[0] ?? 0),
            'minor' => (int) ($parts[1] ?? 0),
            'patch' => (int) ($parts[2] ?? 0),
        ];
    }

    /**
     * Strip a leading `v` from the version string.
     */
    private function stripLeadingV(string $value): string
    {
        return \ltrim($value, 'vV');
    }
}
