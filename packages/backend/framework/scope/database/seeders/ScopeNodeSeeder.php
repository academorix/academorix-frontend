<?php

/**
 * @file database/seeders/ScopeNodeSeeder.php
 *
 * @description
 * Demo-only seeder for {@see \Academorix\Scope\Models\ScopeNode}.
 * Instantiates a three-level tree matching the demo hierarchy
 * defined by {@see ScopeDefinitionSeeder}. Priority 110 so
 * definitions land before their referencing nodes.
 */

declare(strict_types=1);

namespace Academorix\Scope\Database\Seeders;

use Academorix\ServiceProvider\Attributes\AsSeeder;
use Academorix\Scope\Models\ScopeDefinition;
use Academorix\Scope\Models\ScopeNode;
use Illuminate\Database\Seeder;

/**
 * Demo-only node seeder.
 *
 * `priority: 110` — runs AFTER {@see ScopeDefinitionSeeder} so
 * every referenced scope_slug is already in the database.
 */
#[AsSeeder(priority: 110)]
final class ScopeNodeSeeder extends Seeder
{
    public static bool $isDemoOnly = true;

    /**
     * Instantiate one owner root + two academies + three teams
     * per academy for whichever owner the definition seeder
     * created. Tolerates a missing definition set — if the
     * definition seeder was skipped, this one does nothing.
     */
    public function run(): void
    {
        $ownerDef = ScopeDefinition::query()
            ->whereNull('parent_slug')
            ->orderBy('created_at')
            ->first();

        if ($ownerDef === null) {
            // No definitions — nothing to hang nodes off. Silently
            // skip; the demo seed simply produces less data.
            return;
        }

        $ownerId = (string) $ownerDef->owner_id;

        $ownerNode = ScopeNode::factory()->forOwner($ownerId, 'owner')->create();

        // Two academies under the owner.
        foreach (['academy-1', 'academy-2'] as $entityId) {
            $academyNode = ScopeNode::factory()
                ->childOf($ownerNode, 'academy')
                ->create([
                    'entity_id' => $entityId,
                ]);

            // Three teams under each academy.
            for ($t = 1; $t <= 3; $t++) {
                ScopeNode::factory()
                    ->childOf($academyNode, 'team')
                    ->create([
                        'entity_id' => $entityId . '-team-' . $t,
                    ]);
            }
        }
    }
}
