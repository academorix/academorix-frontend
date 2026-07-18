<?php

declare(strict_types=1);

namespace Academorix\Database\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Auto-fill an Eloquent model's primary key with a
 * `<prefix>_<ulid>` value on `creating` when the caller did not
 * supply one.
 *
 * ## Contract
 *
 * A model opts in by:
 *
 *   1. Composing this trait: `use HasPrefixedUlid;`
 *   2. Exposing an `ID_PREFIX` string constant on either the model
 *      itself or (preferred) on the model's column-contract
 *      interface. The trait resolves the prefix by walking the
 *      class's `implements` list and reading the first
 *      `ID_PREFIX` constant it finds.
 *
 * Example wire-up on a fixture-first model:
 *
 * ```php
 * final class Athlete extends Model implements AthleteInterface
 * {
 *     use HasPrefixedUlid;
 *     // ...
 * }
 *
 * interface AthleteInterface
 * {
 *     public const string ID_PREFIX = 'ath';
 *     // ...
 * }
 * ```
 *
 * At runtime, calling `Athlete::create([...])` populates the
 * primary key with `ath_01HZQK8YXBR3MDMP6QT9NR8N4F`. Seeder /
 * fixture rows that already carry a descriptive id
 * (`ath_emma`, `agerule_2526_u10_football`) are respected — the
 * trait only fills in when the id is missing.
 *
 * ## Why ULID (not UUID v4 / snowflake / auto-increment)?
 *
 *   * **Sortable**: lexicographic order matches creation order,
 *     so `ORDER BY id` returns rows chronologically without
 *     needing a secondary `created_at` index.
 *   * **URL-safe**: Crockford Base32 alphabet is unambiguous and
 *     copy/paste friendly (no `I`/`1` or `O`/`0` collisions).
 *   * **Compact**: 26 characters — shorter than a UUID (36) and
 *     much shorter than a base64-encoded snowflake.
 *   * **Distributed-friendly**: 48-bit timestamp + 80-bit
 *     entropy; parallel writers can generate ids without a
 *     coordinator or a database round-trip.
 *
 * ## Design decisions
 *
 *   * The trait wires a `creating` event listener (via Eloquent's
 *     `boot<TraitName>` auto-detection). Choosing `creating` over
 *     the model's `__construct` keeps the id assignment deferred
 *     until the record is actually being persisted — you can
 *     construct model instances with no id (e.g. for unsaved
 *     drafts) and only pay the ulid-generation cost at save time.
 *
 *   * The prefix is resolved once per model class and cached in a
 *     static array on the trait to avoid the reflection overhead
 *     on every insert. Cache key is the `static::class` FQCN.
 *
 *   * The trait treats a null / empty resolved prefix as "no
 *     prefix" — the id becomes a plain 26-char ulid. This
 *     supports models that opt into ulids but don't want a
 *     namespaced key (rare, but useful for global-scope catalog
 *     tables like Country / Timezone).
 *
 * ## Interoperability with other traits
 *
 *   * `HasUuids` (Laravel core) — do not compose both. HasUuids
 *     produces a raw UUID v4 without any prefix; this trait
 *     supersedes it for the prefixed-ulid pattern.
 *   * `SoftDeletes` — orthogonal. The trait only touches the
 *     `creating` event; soft-delete transitions run through
 *     Eloquent's usual `deleting` / `restoring` machinery.
 *   * `Userstamps` — orthogonal. Runs at the same lifecycle
 *     stage but writes a different column set (`created_by`
 *     etc.), so there's no conflict.
 *
 * @mixin Model
 */
trait HasPrefixedUlid
{
    /**
     * Per-class prefix cache. Keyed by the concrete model FQCN
     * (`static::class`) so subclasses of the same base can carry
     * different prefixes.
     *
     * @var array<class-string, string>
     */
    private static array $prefixCache = [];

    /**
     * Eloquent auto-invokes `boot<TraitName>` on every trait a
     * model composes. This wires the `creating` listener.
     */
    public static function bootHasPrefixedUlid(): void
    {
        static::creating(static function (Model $model): void {
            $keyName = $model->getKeyName();

            // Respect any caller-supplied id — seeders + fixture
            // upserts + explicit-id `create(['id' => 'ath_emma'])`
            // calls all fall through this branch.
            if ($model->getAttribute($keyName) !== null && $model->getAttribute($keyName) !== '') {
                return;
            }

            $prefix = self::resolvePrefixFor(static::class);
            $ulid = (string) Str::ulid();

            // Concatenate with `_` only when a prefix is actually
            // configured. A null-or-empty prefix produces a bare
            // ulid, avoiding a leading underscore.
            $id = $prefix !== '' ? $prefix . '_' . $ulid : $ulid;

            $model->setAttribute($keyName, $id);
        });
    }

    /**
     * Resolve the id prefix for a concrete model class.
     *
     * Lookup order:
     *
     *   1. The class's own `ID_PREFIX` constant (rare — the
     *      convention is to declare it on the interface).
     *   2. The `ID_PREFIX` constant of any interface the class
     *      implements. First match wins; walk order is whatever
     *      `class_implements()` returns (implementation order).
     *   3. Empty string when no `ID_PREFIX` is declared anywhere
     *      in the class's contract chain.
     *
     * @param  class-string  $modelClass  The concrete model FQCN.
     */
    private static function resolvePrefixFor(string $modelClass): string
    {
        if (isset(self::$prefixCache[$modelClass])) {
            return self::$prefixCache[$modelClass];
        }

        // Check the class itself first — a model can override an
        // interface-inherited prefix by re-declaring the constant
        // on its own class body.
        if (defined("{$modelClass}::ID_PREFIX")) {
            $value = constant("{$modelClass}::ID_PREFIX");
            if (is_string($value)) {
                return self::$prefixCache[$modelClass] = $value;
            }
        }

        // Walk every interface the class implements looking for
        // `ID_PREFIX`. `class_implements` returns an associative
        // array keyed by short name → FQCN; we iterate the values.
        $interfaces = class_implements($modelClass) ?: [];
        foreach ($interfaces as $interfaceFqcn) {
            if (defined("{$interfaceFqcn}::ID_PREFIX")) {
                $value = constant("{$interfaceFqcn}::ID_PREFIX");
                if (is_string($value)) {
                    return self::$prefixCache[$modelClass] = $value;
                }
            }
        }

        // No prefix declared anywhere — cache the empty string so
        // subsequent inserts skip the whole reflection walk.
        return self::$prefixCache[$modelClass] = '';
    }
}
