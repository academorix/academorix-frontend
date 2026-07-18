<?php

/**
 * @file src/Contracts/Data/ScopeNodeInterface.php
 *
 * @description
 * Column metadata for {@see \Academorix\Scope\Models\ScopeNode}.
 * Nodes are the "concrete instances" of a scope level — each row
 * maps a scope_definition slug to a real entity id (a tenant UUID,
 * an academy UUID, a venue UUID) and carries the full ancestor
 * chain in a materialised_path column for O(1) traversal.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts\Data;

/**
 * Table shape for the `scope_nodes` table.
 *
 * ## Materialised path
 *
 * `materialised_path` stores the full ancestor chain as
 * `/root_id/level1_id/level2_id/.../self_id` (leading slash + slash
 * separators + slash-terminated). A LIKE-prefix query on this column
 * enumerates every descendant of a node in one seek; splitting on
 * `/` yields the exact ancestor list without recursion.
 *
 * Trade-off: writes are O(N) in the subtree size (moving a node
 * requires updating every descendant's path). Scope trees are
 * small and re-shaped rarely, so the read-side savings dominate.
 */
interface ScopeNodeInterface
{
    public const string TABLE = 'scope_nodes';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    /** UUID primary key. */
    public const string ATTR_ID = 'id';

    /** Owner id (usually tenant UUID). Cross-module FK by convention. */
    public const string ATTR_OWNER_ID = 'owner_id';

    /**
     * Scope-definition slug this node represents ('venue',
     * 'academy', 'team'). References `scope_definitions.slug` within
     * the same owner.
     */
    public const string ATTR_SCOPE_SLUG = 'scope_slug';

    /**
     * Real entity id this node represents — a venue UUID, an
     * academy UUID, or the owner's own id at the root. Kept as
     * VARCHAR(255) so numeric ids from legacy tables also fit.
     */
    public const string ATTR_ENTITY_ID = 'entity_id';

    /**
     * Parent node UUID (self-FK). `null` for root nodes.
     */
    public const string ATTR_PARENT_NODE_ID = 'parent_node_id';

    /**
     * Materialised path — slash-separated ancestor UUIDs, leading
     * and trailing slashes, including this node's id at the end.
     * Example: `/ROOT_ID/OWNER_ID/REGION_ID/VENUE_ID/`.
     */
    public const string ATTR_MATERIALISED_PATH = 'materialised_path';

    /**
     * Node depth from the root — 0 for root, 1 for children, etc.
     * Denormalised for cheap indexed queries ("all leaves", "level 2
     * only"). Recomputed on move.
     */
    public const string ATTR_DEPTH = 'depth';

    /** Standard timestamps. */
    public const string ATTR_CREATED_AT = 'created_at';

    public const string ATTR_UPDATED_AT = 'updated_at';

    public const string ATTR_DELETED_AT = 'deleted_at';
}
