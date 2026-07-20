<?php

/**
 * @file database/seeders/ScopeValueSeeder.php
 *
 * @description
 * Demo-only seeder for {@see \Academorix\Scope\Models\ScopeValue}.
 * Writes a small sample of stored values against the demo tree
 * so contributors can exercise `Scope::resolve()` end-to-end
 * without hand-inserting rows. The `testing` namespace is used
 * because no real consumer namespace is guaranteed to be
 * registered at seed time.
 */

declare(strict_types=1);

namespace Academorix\Scope\Database\Seeders;

use Academorix\ServiceProvider\Attributes\AsSeeder;
use Academorix\Scope\Models\ScopeNode;
use Academorix\Scope\Models\ScopeValue;
use Illuminate\Database\Seeder;

/**
 * Demo-only value seeder.
 *
 * `priority: 130` — runs LAST in the scope seeder group.
 */
#[AsSeeder(priority: 130)]
final class ScopeValueSeeder extends Seeder
{
    public static bool $isDemoOnly = true;

    /**
     * Writes one value at each level of the demo tree so callers
     * can watch the cascade in action:
     *
     *   - root:  `testing.greeting` = "hello from owner"
     *   - academy: (nothing — cascade should surface the root value)
     *   - team-1:   `testing.greeting` = "hello from team 1"
     *
     * A subsequent read at team-1 wins its own value; a read at
     * academy or team-2/-3 walks up and sees the root value.
     */
    public function run(): void
    {
        $root = ScopeNode::query()
            ->whereNull('parent_node_id')
            ->orderBy('created_at')
            ->first();

        if ($root === null) {
            // No demo tree — nothing to attach values to.
            return;
        }

        ScopeValue::factory()
            ->atNode($root)
            ->forKey('testing', 'greeting')
            ->create([
                'value' => 'hello from owner',
            ]);

        // Deepest node — grabs the first leaf we find under the
        // root. Not deterministic across worlds, but plenty
        // deterministic for a demo.
        $leaf = ScopeNode::query()
            ->where('owner_id', $root->owner_id)
            ->where('depth', 2)
            ->orderBy('created_at')
            ->first();

        if ($leaf !== null) {
            ScopeValue::factory()
                ->atNode($leaf)
                ->forKey('testing', 'greeting')
                ->create([
                    'value' => 'hello from team 1',
                ]);
        }
    }
}
