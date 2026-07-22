<?php

/**
 * @file database/seeders/DatabaseSeeder.php
 *
 * @description
 * One-line seeder shell — every real seeder self-declares via
 * `#[AsSeeder(priority, environments)]` per ADR-0011 and is
 * discovered at boot by the framework. `run()` delegates to
 * the discovery seam, which iterates every attributed seeder
 * in priority order + fires each. Adding a seeder is one file
 * in a package; no edit to this file.
 */

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Foundation\Attributes\AsSeeder;

final class DatabaseSeeder extends Seeder
{
    /**
     * Walk every `#[AsSeeder]`-tagged class, filter by environment,
     * sort by priority, and call each. See ADR-0011 for the
     * discovery contract.
     */
    public function run(DiscoversAttributes $discovery): void
    {
        $env = $this->container->environment();
        $seeders = [];

        foreach ($discovery->forClass(AsSeeder::class) as $target) {
            $attribute = $target->attribute;

            if ($attribute->enabled === false) {
                continue;
            }
            if ($attribute->environments !== []
                && ! in_array($env, $attribute->environments, true)) {
                continue;
            }

            $seeders[] = [
                'priority' => $attribute->priority,
                'fqcn' => $target->className,
            ];
        }

        usort(
            $seeders,
            static fn (array $a, array $b): int => [$a['priority'], $a['fqcn']]
                <=> [$b['priority'], $b['fqcn']],
        );

        foreach ($seeders as $row) {
            $this->call($row['fqcn']);
        }
    }
}
