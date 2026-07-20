<?php

declare(strict_types=1);

namespace Academorix\Versioning\Schemes;

use Academorix\Versioning\Contracts\Services\VersionSchemeInterface;

/**
 * CalVer implementation of {@see VersionSchemeInterface}.
 *
 * Accepts `YYYY.MM.DD`, `YYYY-MM-DD`, `YYYY.MM`, `YYYY-MM`, and
 * `YYYY` shapes. Comparison strips separators + zero-pads missing
 * segments then compares lexicographically — every CalVer variant
 * sorts monotonically after normalisation. Every release is
 * potentially breaking, so constraints degrade to equality checks.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class CalVerScheme implements VersionSchemeInterface
{
    /**
     * Compare two CalVer strings.
     */
    public function compare(string $a, string $b): int
    {
        return $this->normalise($a) <=> $this->normalise($b);
    }

    /**
     * CalVer treats constraints as equality — every release is a
     * distinct point in calendar time, so `~2024.10` semantics are
     * undefined. Callers that want ranges over CalVer must implement
     * their own scheme adapter.
     */
    public function matches(string $version, string $constraint): bool
    {
        return $this->normalise($version) === $this->normalise($constraint);
    }

    /**
     * Parse a CalVer string into `year`, `month`, `day`.
     *
     * @return array<string, int|string>
     */
    public function parse(string $version): array
    {
        $parts = \preg_split('/[.\-]/', $version) ?: [];

        return [
            'year'  => (int) ($parts[0] ?? 0),
            'month' => (int) ($parts[1] ?? 0),
            'day'   => (int) ($parts[2] ?? 0),
        ];
    }

    /**
     * Normalise a CalVer to a padded `YYYYMMDD` string for
     * lexicographic comparison.
     */
    private function normalise(string $value): string
    {
        $parts = \preg_split('/[.\-]/', $value) ?: [];

        $year  = \str_pad((string) (int) ($parts[0] ?? 0), 4, '0', STR_PAD_LEFT);
        $month = \str_pad((string) (int) ($parts[1] ?? 0), 2, '0', STR_PAD_LEFT);
        $day   = \str_pad((string) (int) ($parts[2] ?? 0), 2, '0', STR_PAD_LEFT);

        return $year . $month . $day;
    }
}
