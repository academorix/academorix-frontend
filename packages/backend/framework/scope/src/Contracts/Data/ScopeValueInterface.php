<?php

/**
 * @file src/Contracts/Data/ScopeValueInterface.php
 *
 * @description
 * Column metadata for {@see \Stackra\Scope\Models\ScopeValue} —
 * the namespaced key-value store attached to scope nodes. Every
 * consumer package (settings, permissions, feature flags, pricing)
 * writes into this table under its registered namespace, and
 * cascading reads walk the active node's materialised_path in
 * descending order to return the first hit per key.
 */

declare(strict_types=1);

namespace Stackra\Scope\Contracts\Data;

use Stackra\Scope\Contracts\ScopeRegistryInterface;

/**
 * Table shape for the `scope_values` table.
 *
 * ## Uniqueness
 *
 * The `(scope_node_id, namespace, key)` triple is unique — a given
 * consumer owns exactly one value per key per node. Cascading
 * resolution across ancestors is a READ concern; storage is flat.
 *
 * ## Value shape
 *
 * `value` is JSONB (Postgres) or JSON (MySQL). Consumers persist
 * any serialisable PHP value; the resolver returns it decoded.
 * The value's runtime type contract is enforced by the consumer's
 * `ScopeConsumerConfig::$validator` closure, NOT by the storage
 * engine — the scope package stays type-agnostic.
 */
interface ScopeValueInterface
{
    public const string TABLE = 'scope_values';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    /** UUID primary key. */
    public const string ATTR_ID = 'id';

    /**
     * FK to `scope_nodes.id`. Cascading DELETE — when a node is
     * removed, its stored values vanish with it.
     */
    public const string ATTR_SCOPE_NODE_ID = 'scope_node_id';

    /**
     * Consumer namespace ('settings', 'permissions', 'feature_flags').
     * Must match a namespace registered via
     * {@see ScopeRegistryInterface::consumer()}.
     * The runtime validator refuses writes to un-registered
     * namespaces (fail-loud).
     */
    public const string ATTR_NAMESPACE = 'namespace';

    /**
     * Configuration key within the namespace. Dot-notated by
     * convention: `general.timezone`, `mail.driver`, `theme.accent`.
     * Length 255 accommodates deep hierarchies.
     */
    public const string ATTR_KEY = 'key';

    /**
     * JSONB payload. Any serialisable value. Consumer-owned type
     * contract via `ScopeConsumerConfig::$validator`.
     */
    public const string ATTR_VALUE = 'value';

    /**
     * User who wrote the value. Optional — internal jobs (seeders,
     * migrations, scheduled tasks) leave this null.
     */
    public const string ATTR_UPDATED_BY = 'updated_by';

    /** Standard timestamps. */
    public const string ATTR_CREATED_AT = 'created_at';

    public const string ATTR_UPDATED_AT = 'updated_at';
}
