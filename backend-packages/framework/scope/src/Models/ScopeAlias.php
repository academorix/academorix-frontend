<?php

/**
 * @file src/Models/ScopeAlias.php
 *
 * @description
 * Eloquent model for the `scope_aliases` table. Deployment-specific
 * label overrides for scope-definition slugs — e.g. a specific
 * tenant may want "tenant" rendered as "organisation" everywhere.
 * Consumed by the admin UI and by anything that renders a scope
 * label.
 */

declare(strict_types=1);

namespace Academorix\Scope\Models;

use Academorix\Scope\Contracts\Data\ScopeAliasInterface;
use Academorix\Scope\Database\Factories\ScopeAliasFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $owner_id
 * @property string $scope_slug
 * @property string $alias_label
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[Table(
    name: ScopeAliasInterface::TABLE,
    key: ScopeAliasInterface::PRIMARY_KEY,
    keyType: ScopeAliasInterface::KEY_TYPE,
)]
#[Fillable([
    // Three-column override — no computed fields, everything is
    // writable through the admin controller that owns the alias UI.
    ScopeAliasInterface::ATTR_OWNER_ID,
    ScopeAliasInterface::ATTR_SCOPE_SLUG,
    ScopeAliasInterface::ATTR_ALIAS_LABEL,
])]
#[UseFactory(ScopeAliasFactory::class)]
final class ScopeAlias extends Model implements ScopeAliasInterface
{
    /** @use HasFactory<ScopeAliasFactory> */
    use HasFactory;

    use HasUuids;
}
