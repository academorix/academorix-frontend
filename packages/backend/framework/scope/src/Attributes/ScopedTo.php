<?php

/**
 * @file src/Attributes/ScopedTo.php
 *
 * @description
 * Marker attribute that opts an Eloquent model into automatic
 * hierarchical-scope filtering by the scope PLATFORM. When a model
 * carries this attribute AND its table has a `scope_node_id`
 * column, {@see \Stackra\Scope\Scopes\ScopedGlobalScope}
 * appends `WHERE scope_node_id IN (<ancestor chain of Scope::current()>)`
 * to every query.
 *
 * ## Disambiguation vs. CRUD attributes
 *
 * The framework has three scope-related attributes that occupy
 * distinct roles — DO NOT conflate them:
 *
 *   - `#[ScopedTo]` (THIS attribute) — declares INTENT: "this
 *     model participates in the scope-platform's ancestor-chain
 *     filtering." The concrete `Scope` implementation is fixed
 *     (`ScopedGlobalScope`); no parameter picks a specific class.
 *
 *   - `#[Stackra\Crud\Attributes\UseScope(ScopeClass::class)]`
 *     — declares MECHANISM: "apply this SPECIFIC Eloquent
 *     `Scope` class to my queries." Takes a class-string. The
 *     model can carry many of these to compose scopes.
 *
 *   - `#[Stackra\Crud\Attributes\AsScope(name: '…')]` —
 *     declares CLASSIFICATION: "I AM a Scope implementation
 *     discoverable by name." Marks a class that IMPLEMENTS
 *     Laravel's `Scope` interface. Consumed by CRUD's scope
 *     registry for named-scope lookup.
 *
 * TL;DR: `ScopedTo` sits on domain models to enable the platform
 * filter. `UseScope` sits on models to apply CRUD-supplied Scope
 * classes. `AsScope` sits on Scope classes themselves.
 *
 * ## The `level` parameter
 *
 * A semantic hint — the slug of the scope-definition level this
 * model belongs to (`'venue'`, `'academy'`, `'team'`). Optional
 * because the primary filter uses materialised-path ancestry, not
 * level equality; the slug is consumed by tooling (auto-attach
 * helpers, admin UI, seeders).
 */

declare(strict_types=1);

namespace Stackra\Scope\Attributes;

use Attribute;

/**
 * Auto-scope this Eloquent model by the active scope node's ancestor
 * chain.
 *
 * ## Basic usage
 *
 * ```php
 * use Stackra\Scope\Attributes\ScopedTo;
 * use Illuminate\Database\Eloquent\Model;
 *
 * #[ScopedTo]
 * final class Invoice extends Model
 * {
 *     protected $fillable = ['amount', 'scope_node_id'];
 * }
 * ```
 *
 * Every query on `Invoice` now includes the current scope's
 * ancestor chain in the `scope_node_id` filter. No explicit
 * `where('scope_node_id', ...)` needed.
 *
 * ## With a level hint
 *
 * ```php
 * #[ScopedTo(level: 'venue')]
 * final class VenueBooking extends Model {}
 * ```
 *
 * The level hint is used by the admin UI (to render a venue picker
 * in the query builder) and by seeders (to bind fixtures to the
 * right node level). It has NO effect on the query filter itself.
 *
 * ## Opt-out
 *
 * Individual queries can bypass the auto-scope with
 * `Model::withoutGlobalScope(ScopedGlobalScope::class)` or by
 * annotating an entire method with {@see BypassScope}.
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class ScopedTo
{
    /**
     * Create a new ScopedTo attribute instance.
     *
     * @param  string|null  $level  Semantic hint — the slug of the
     *                              scope-definition level this model
     *                              belongs to (e.g. 'venue', 'team').
     *                              Optional; the query filter uses
     *                              ancestry, not level equality.
     */
    public function __construct(
        public ?string $level = null,
    ) {}
}
