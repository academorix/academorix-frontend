<?php

declare(strict_types=1);

namespace Academorix\Database\Concerns;

// TODO: The generator-side collaborators referenced from this
// trait's docblock (FixtureLoader, ModelInterfaceRewriter) lived
// in the old Foundation module's Console/Generators tree. That
// tooling has not been ported into the new monorepo yet — see
// MIGRATION.md. The referenced classes are only mentioned in
// `@see` links and the descriptive comment inside `getRows()`;
// nothing on the runtime hot path needs them. The imports are
// removed to keep autoload happy; the docblocks below still
// name the classes verbatim for the impending Console tooling
// port.

use JsonException;
use ReflectionClass;
use RuntimeException;
use Sushi\Sushi;

/**
 * Fixture-backed Eloquent storage trait.
 *
 * Composing this trait on a model wires the class into
 * {@see Sushi calebporzio/sushi} — the "Eloquent array
 * driver" — so every row that ships in
 * `modules/<Module>/database/fixtures/<kebab-plural>.json` becomes
 * available through the full Eloquent surface: `Model::all()`,
 * `Model::where(...)->get()`, relations, scopes, the Query Builder,
 * factories, and the paginator all work verbatim, because Sushi
 * boots the class against an on-disk SQLite cache that mirrors the
 * shipped JSON.
 *
 * ## What Sushi already provides
 *
 * Sushi handles every heavy-lifting concern by itself:
 *
 *  * `bootSushi()` — Laravel model boot hook that spins up an SQLite
 *    connection scoped to the model class and rebuilds it whenever
 *    the on-disk cache is missing / stale.
 *  * `createTable()` / `migrate()` — column-type inference from the
 *    first row's PHP scalar types (`is_int` → `integer`, `is_string`
 *    → `string`, etc.) plus an optional `getSchema()` override for
 *    columns whose type cannot be inferred from the sample.
 *  * `getConnectionName()` — scopes the SQLite connection to
 *    `static::class` so two Sushi models never clash.
 *  * Cache invalidation — Sushi compares `filemtime()` of the fixture
 *    file against the SQLite cache file's mtime and rebuilds when
 *    the fixture is newer.
 *
 * ## What this trait adds on top
 *
 * Two extension points, both tightly scoped:
 *
 *   1. {@see getRows()} — Sushi's contract for supplying row data.
 *      The trait decodes the JSON fixture at {@see resolveFixturePath()}
 *      and returns its row list. When no fixture ships, an empty
 *      list is returned and Sushi creates an empty table (via
 *      {@see Sushi::createTableWithNoData()}) so `Model::all()`
 *      returns an empty collection instead of throwing.
 *   2. {@see sushiCacheReferencePath()} — points Sushi's cache
 *      invalidation at the JSON file rather than the model source
 *      file. This is the single most important override in the
 *      trait: without it, Sushi would rebuild the SQLite cache
 *      only when the model class itself changes, and edits to the
 *      shipped fixture would go unnoticed until a `composer dump`.
 *
 * ## Fixture path resolution
 *
 * The trait walks the following preference chain, first hit wins:
 *
 *   1. **Static property `$mockDataFile`** on the model class.
 *      When set, this is either an absolute path or a filename
 *      resolved against the model's module fixtures directory.
 *      This is the legacy escape hatch — new models should not
 *      set it, they should rely on preference 2 or 3.
 *   2. **Interface constant `MOCK_DATA_FILE`** on the model's
 *      companion `<Model>Interface`. When the model implements the
 *      generated Contracts/Data interface (as every fixture-first
 *      model in this codebase does), the interface exposes the
 *      fixture filename as a class constant, mirroring Magento 2's
 *      `Api/Data/*Interface::KEY_*` pattern. This is the preferred
 *      declarative form.
 *   3. **Convention** — the trait derives the fixture slug from
 *      the model's short name via `Str::kebab(Str::pluralStudly($short))`
 *      and joins it against the module's fixtures directory. This
 *      is the zero-config fallback — most fixture-first models
 *      never need to declare the path explicitly.
 *
 * ## Composition rules
 *
 * Compose this trait *before* domain traits so Sushi's `bootSushi()`
 * runs before any observer / event traits that assume the row data
 * is already available at boot time. In practice PHP invokes trait
 * boot hooks in the order the `use` statements appear in the class
 * body, so a fixture-first model reads:
 *
 * ```php
 * final class Athlete extends Model implements AthleteInterface
 * {
 *     use HasMockableStorage; // MUST come first
 *     use HasFactory;
 *     use SoftDeletes;
 *     // ...
 * }
 * ```
 *
 * The generator emits the `use` statements in this canonical order
 * so successive regenerations produce byte-identical output.
 *
 * ## When NOT to compose this trait
 *
 * DB-backed models (Country, Currency, Sport, real user records,
 * anything that must survive across worker restarts) MUST NOT
 * compose this trait — Sushi's in-memory SQLite is per-worker and
 * has no persistence guarantee. The command's fixture-existence
 * check gates the trait injection so DB-backed models are never
 * accidentally wired to Sushi.
 *
 * @see Sushi The underlying package.
 * @see \Academorix\Foundation\Console\Generators\ModelInterfaceRewriter How the trait is injected during generation. (pending port — see file header)
 */
trait HasMockableStorage
{
    /**
     * Compose Sushi's boot hook + connection / schema helpers.
     *
     * `bootSushi()` runs during Eloquent's model boot cycle and:
     *   * Creates or reuses the SQLite cache file at
     *     {@see Sushi::sushiCachePath()}.
     *   * Configures a private database connection scoped to
     *     `static::class` (so two Sushi models never share a
     *     connection).
     *   * Calls {@see Sushi::migrate()} to (re)create the
     *     backing SQLite table from `getRows()`.
     */
    use Sushi;

    /**
     * In-memory cache for the resolved fixture path per model class.
     *
     * Sushi calls `sushiCacheReferencePath()` and `getRows()`
     * separately during its boot cycle; without this cache we would
     * walk the reflection chain + `Str::kebab` transform twice per
     * boot. The cache is keyed on `static::class` so subclasses
     * (unlikely but possible) resolve independently.
     *
     * @var array<class-string, string|null>
     */
    private static array $mockablePathCache = [];

    /**
     * Return the fixture rows the Sushi trait ingests into its
     * per-model SQLite table.
     *
     * The rows are decoded from the fixture JSON on every call —
     * decoding is cheap (single `file_get_contents` + `json_decode`)
     * and Sushi caches the resulting SQLite table on disk, so this
     * method fires exactly once per worker per model whose cache is
     * stale.
     *
     * ## Envelope tolerance
     *
     * Some shipped fixtures wrap the row list in a
     * `{"data": [...]}` envelope for schema-registry parity with
     * the public API. This method unwraps that envelope
     * transparently — matching the behaviour of
     * {@see \Academorix\Foundation\Console\Generators\FixtureLoader} (pending port)
     * so the generator + runtime agree on the row shape.
     *
     * ## Failure modes
     *
     * - Fixture file missing → returns `[]`. Sushi then creates an
     *   empty table via `createTableWithNoData()` so `Model::all()`
     *   returns an empty collection rather than throwing.
     * - Fixture file unreadable → throws `RuntimeException` because
     *   silently ignoring an IO failure would mask a broken deploy.
     * - Fixture file present but invalid JSON → throws
     *   `RuntimeException` because a corrupt fixture would produce
     *   an unpredictable SQLite table.
     *
     * @return list<array<string, mixed>>
     */
    public function getRows(): array
    {
        $path = self::resolveFixturePath();

        // Path resolution deliberately returns `null` for models
        // where no fixture can be located; Sushi copes with the
        // empty-row branch out of the box.
        if ($path === null || ! is_file($path)) {
            return [];
        }

        // ---------------------------------------------------------
        // IO — narrow read + defensive error surface.
        // ---------------------------------------------------------
        $raw = @file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException(sprintf(
                'HasMockableStorage: fixture at %s is not readable.',
                $path,
            ));
        }

        try {
            /** @var mixed $decoded */
            $decoded = json_decode(
                $raw,
                associative: true,
                flags: JSON_THROW_ON_ERROR,
            );
        } catch (JsonException $jsonException) {
            throw new RuntimeException(
                sprintf(
                    'HasMockableStorage: fixture at %s contains invalid JSON: %s',
                    $path,
                    $jsonException->getMessage(),
                ),
                previous: $jsonException,
            );
        }

        if (! is_array($decoded)) {
            return [];
        }

        // Unwrap `{"data": [...]}` envelope — mirrors
        // FixtureLoader's tolerance so runtime + generator agree.
        if (array_key_exists('data', $decoded) && is_array($decoded['data'])) {
            $decoded = $decoded['data'];
        }

        // Re-index as a sequential list. Some fixtures ship as
        // string-keyed maps for hand-editing ergonomics; Sushi
        // needs a numeric-indexed list of associative rows.
        $rows = [];
        foreach ($decoded as $row) {
            if (is_array($row)) {
                $rows[] = self::normaliseRowForSushi($row);
            }
        }

        // Widen every row to the union column set. Sparse rows
        // (a `notes` column that only some entries carry) would
        // otherwise trip Sushi's `insert()` — Laravel's multi-row
        // insert derives the column list from the FIRST row and
        // then throws `all VALUES must have the same number of
        // terms` when subsequent rows have a different key count.
        //
        // The widening pass:
        //   1. Walks every row and collects the union of keys.
        //   2. Rewrites each row to carry EVERY union key, filling
        //      missing entries with `null`.
        //
        // Column order is stable — keys are appended in
        // first-seen order across the rows, matching the
        // "first row wins" schema inference Sushi's
        // {@see \Sushi\Sushi::createTable()} performs.
        return self::widenRowsToUnionColumns($rows);
    }

    /**
     * The audit trio + soft-deletes columns every fixture-first
     * model composes at the migration layer.
     *
     * Sushi's `createTable()` inspects only the columns present in
     * the FIRST row of the dataset — it will not add columns that
     * live only in `getSchema()`. But every fixture-first model in
     * this codebase composes `SoftDeletes` (which query-scopes
     * `WHERE deleted_at IS NULL`) and Mattiverse Userstamps (which
     * expects `created_by` / `updated_by` / `deleted_by` to exist
     * as columns).
     *
     * The widening pass pre-seeds the union with these columns so
     * they land on every emitted row — even when the shipped
     * fixture omits them (which is the norm; fixtures rarely ship
     * `deleted_at` because no fixture row is soft-deleted).
     *
     * @var list<string>
     */
    private const AUDIT_TRIO_COLUMNS = [
        'created_at',
        'updated_at',
        'deleted_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * Ensure every row exposes the union of all keys across the
     * dataset, defaulting missing keys to `null`. See
     * {@see getRows()} for the rationale.
     *
     * The union is seeded with the audit-trio columns (see
     * {@see AUDIT_TRIO_COLUMNS}) so Sushi's `createTable()` picks
     * them up even when the shipped fixture never mentions them.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private static function widenRowsToUnionColumns(array $rows): array
    {
        if ($rows === []) {
            return $rows;
        }

        // Pre-seed the union with the audit trio so SoftDeletes'
        // `deleted_at is null` scope and Userstamps' by-columns
        // are always present as SQLite columns.
        $unionKeys = [];
        foreach (self::AUDIT_TRIO_COLUMNS as $column) {
            $unionKeys[$column] = true;
        }

        // Collect the fixture's own union of keys, preserving
        // first-seen order.
        foreach ($rows as $row) {
            foreach (array_keys($row) as $key) {
                if (! array_key_exists($key, $unionKeys)) {
                    $unionKeys[$key] = true;
                }
            }
        }

        // Widen each row. `array_key_exists` (not `isset`)
        // preserves genuine `null` values already declared on
        // the source row.
        $widened = [];
        foreach ($rows as $row) {
            $out = [];
            foreach (array_keys($unionKeys) as $key) {
                $out[$key] = array_key_exists($key, $row) ? $row[$key] : null;
            }
            $widened[] = $out;
        }

        return $widened;
    }

    /**
     * Normalise a single fixture row so every value is a
     * SQLite-bindable scalar (or `null`).
     *
     * Fixture files freely mix scalar and structured values —
     * `from_scope: {"type": "team", "id": "..."}`,
     * `metadata: [...]`, and similar. Sushi's `migrate()` step
     * inserts rows via PDO bindings which reject non-scalar
     * PHP types with an `Array to string conversion` error.
     *
     * This method walks each value:
     *   * Scalars (int / string / bool / float) + null → pass-through.
     *   * Arrays + `\stdClass` + `JsonSerializable` → JSON-encode.
     *   * `\DateTimeInterface` → ISO-8601 string (mirrors
     *     Eloquent's serialisation).
     *   * Anything else → cast to string via `(string)`.
     *
     * The JSON encoding uses `JSON_UNESCAPED_UNICODE +
     * JSON_UNESCAPED_SLASHES` so URL / display strings survive a
     * round-trip unchanged.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function normaliseRowForSushi(array $row): array
    {
        $out = [];

        foreach ($row as $key => $value) {
            if ($value === null || is_scalar($value)) {
                // The most common case — pass-through.
                $out[$key] = $value;

                continue;
            }

            if ($value instanceof \DateTimeInterface) {
                $out[$key] = $value->format(\DateTimeInterface::ATOM);

                continue;
            }

            if (is_array($value)
                || $value instanceof \stdClass
                || $value instanceof \JsonSerializable) {
                $encoded = json_encode(
                    $value,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                );

                $out[$key] = $encoded === false ? null : $encoded;

                continue;
            }

            // Objects with a __toString or anything else exotic:
            // best-effort cast. We deliberately do NOT throw — the
            // trait's contract is "make Sushi happy" and losing a
            // one-off value is preferable to a boot-time crash.
            $out[$key] = (string) $value;
        }

        return $out;
    }

    /**
     * Point Sushi's cache invalidation at the fixture JSON.
     *
     * Sushi compares `filemtime()` of this path against
     * `filemtime()` of its SQLite cache file and rebuilds when the
     * fixture is newer. Without this override Sushi defaults to
     * the model source file, which means a fixture-only edit
     * would not trigger a cache rebuild until the model source is
     * touched — a subtle and frustrating footgun that this
     * override eliminates.
     *
     * When no fixture can be resolved the method returns the model
     * source file (Sushi's default) so its `filemtime()` comparison
     * never sees a non-existent path.
     */
    protected function sushiCacheReferencePath(): string
    {
        $path = self::resolveFixturePath();

        if ($path === null || ! is_file($path)) {
            // Fallback — Sushi's own default. Ensures the mtime
            // comparison always operates on a real file.
            return (new ReflectionClass(static::class))->getFileName()
                ?: __FILE__;
        }

        return $path;
    }

    /**
     * Resolve the absolute path to this model's fixture JSON, or
     * `null` when no fixture can be located.
     *
     * Preference chain (first hit wins):
     *   1. Static property `$mockDataFile` on the model class.
     *   2. Interface constant `MOCK_DATA_FILE` on any interface
     *      the model implements.
     *   3. Convention:
     *      `modules/<Module>/database/fixtures/<kebab-plural>.json`.
     *
     * Results are cached per model class in
     * {@see $mockablePathCache} so consecutive Sushi lifecycle
     * calls (`sushiCacheReferencePath()` → `getRows()` →
     * `getConnectionName()`) do not re-walk the reflection chain.
     */
    protected static function resolveFixturePath(): ?string
    {
        // Cache lookup — return `null` if it is genuinely null.
        // A cache miss is signalled by `array_key_exists`, not by
        // a `??` check (null is a valid cached result).
        $class = static::class;
        if (array_key_exists($class, self::$mockablePathCache)) {
            return self::$mockablePathCache[$class];
        }

        // -----------------------------------------------------------------
        // Preference 1 — explicit static property override.
        // -----------------------------------------------------------------
        $explicit = self::readMockDataFileProperty();
        if ($explicit !== null) {
            $resolved = self::resolveFixtureReference($explicit);

            return self::$mockablePathCache[$class] = $resolved;
        }

        // -----------------------------------------------------------------
        // Preference 2 — interface constant `MOCK_DATA_FILE`.
        // -----------------------------------------------------------------
        $fromInterface = self::readMockDataFileFromInterfaces();
        if ($fromInterface !== null) {
            $resolved = self::resolveFixtureReference($fromInterface);

            return self::$mockablePathCache[$class] = $resolved;
        }

        // -----------------------------------------------------------------
        // Preference 3 — convention.
        // -----------------------------------------------------------------
        $conventional = self::resolveConventionalFixturePath();

        return self::$mockablePathCache[$class] = $conventional;
    }

    /**
     * Read the model's static `$mockDataFile` property, if declared.
     *
     * Guarded so a hand-authored model that omits the property
     * doesn't crash reflection. Returns `null` when the property is
     * absent, empty, or a non-string.
     */
    private static function readMockDataFileProperty(): ?string
    {
        if (! property_exists(static::class, 'mockDataFile')) {
            return null;
        }

        $value = static::$mockDataFile ?? null;

        if (! is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    /**
     * Walk the model's `implements` list and return the first
     * `MOCK_DATA_FILE` constant we find.
     *
     * Every fixture-first model in this codebase implements
     * exactly one `<Model>Interface` under `Contracts/Data/`, so
     * the walk terminates in O(1) in practice. The generator emits
     * the constant with the fixture filename (e.g. `'athletes.json'`)
     * or a module-relative subpath — see
     * {@see resolveFixtureReference()}.
     */
    private static function readMockDataFileFromInterfaces(): ?string
    {
        $reflection = new ReflectionClass(static::class);

        foreach ($reflection->getInterfaceNames() as $interface) {
            if (! defined($interface . '::MOCK_DATA_FILE')) {
                continue;
            }

            /** @var mixed $value */
            $value = constant($interface . '::MOCK_DATA_FILE');

            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Resolve a preference-1 / preference-2 reference to an
     * absolute path.
     *
     * The reference may already be absolute (starts with `/` or a
     * Windows drive letter) in which case it is returned verbatim.
     * Otherwise it is treated as a filename or module-relative
     * subpath and joined against the model's module fixtures
     * directory (`modules/<Module>/database/fixtures/`).
     *
     * @param  string  $reference  The declared reference (property or interface constant value).
     */
    private static function resolveFixtureReference(string $reference): ?string
    {
        // Absolute paths (POSIX + Windows) pass through untouched.
        if (str_starts_with($reference, DIRECTORY_SEPARATOR)
            || preg_match('/^[A-Za-z]:[\\\\\\/]/', $reference) === 1) {
            return $reference;
        }

        $fixturesDir = self::resolveFixturesDirectory();
        if ($fixturesDir === null) {
            return null;
        }

        return $fixturesDir . DIRECTORY_SEPARATOR . ltrim($reference, '/\\');
    }

    /**
     * Return the absolute path to the model's module fixtures
     * directory (`modules/<Module>/database/fixtures/`).
     *
     * The module name is inferred from the model's fully-qualified
     * class name — every module in this codebase is namespaced
     * `Academorix\<Module>\Models\<Class>`, so the module segment
     * is the second `\`-delimited fragment. When the FQCN does not
     * match that shape the method returns `null` and the caller
     * falls back to the model source file.
     */
    private static function resolveFixturesDirectory(): ?string
    {
        $segments = explode('\\', static::class);
        if (count($segments) < 3) {
            return null;
        }

        $module = $segments[1];

        return self::modulesRoot()
            . DIRECTORY_SEPARATOR . $module
            . DIRECTORY_SEPARATOR . 'database'
            . DIRECTORY_SEPARATOR . 'fixtures';
    }

    /**
     * Return the absolute path to the `modules/` root.
     *
     * Uses Laravel's `base_path()` helper when the application
     * container is booted; falls back to a filesystem walk from
     * this file's location for the (unusual) case where the trait
     * boots before the application binding is available.
     */
    private static function modulesRoot(): string
    {
        if (function_exists('base_path')) {
            return base_path('modules');
        }

        // Filesystem walk: this file lives at
        // `modules/Foundation/src/Concerns/HasMockableStorage.php`,
        // so four `dirname()` steps land on `modules/`.
        return dirname(__DIR__, 3);
    }

    /**
     * Derive the conventional fixture path from the model FQCN.
     *
     * `Academorix\Athletics\Models\Athlete` →
     *   `modules/Athletics/database/fixtures/athletes.json`.
     *
     * The slug is the kebab-cased plural of the model's short
     * name. The pluralisation uses PHP's builtin
     * {@see Str::pluralStudly()} when Laravel's helper is
     * available, and a minimal English-only fallback otherwise
     * (add `s`, or `ies` for `y`-endings). This mirrors
     * {@see DiscoveredModel::fixturePath()} so the runtime + the
     * generator agree on the file location.
     */
    private static function resolveConventionalFixturePath(): ?string
    {
        $fixturesDir = self::resolveFixturesDirectory();
        if ($fixturesDir === null) {
            return null;
        }

        $short = self::modelShortName();
        $slug = self::kebabPlural($short);

        return $fixturesDir . DIRECTORY_SEPARATOR . $slug . '.json';
    }

    /**
     * Return the model's short class name.
     */
    private static function modelShortName(): string
    {
        $segments = explode('\\', static::class);

        return end($segments) ?: static::class;
    }

    /**
     * Convert `AthleteDocument` → `athlete-documents`.
     *
     * Prefers Laravel's `Illuminate\Support\Str` when the class is
     * loaded (as it always is in a Laravel runtime); otherwise falls
     * back to a minimal English pluraliser + camel-to-kebab
     * transform. The fallback is only for edge-case boot orderings
     * where the trait fires before Support is loaded (rare, but
     * possible during composer autoload of console commands).
     */
    private static function kebabPlural(string $short): string
    {
        if (class_exists('Illuminate\\Support\\Str', false)) {
            /** @var string $plural */
            $plural = \Illuminate\Support\Str::pluralStudly($short);

            /** @var string $kebab */
            $kebab = \Illuminate\Support\Str::kebab($plural);

            return $kebab;
        }

        // -------------------------------------------------
        // Minimal fallback. Not perfect English, but good
        // enough for the class names this codebase ships.
        // -------------------------------------------------
        $plural = self::minimalPluraliser($short);

        // Camel → kebab.
        $kebab = (string) preg_replace('/([a-z0-9])([A-Z])/', '$1-$2', $plural);

        return strtolower($kebab);
    }

    /**
     * Minimal English pluraliser for the class-name fallback path.
     *
     * Handles the four rules that cover 99% of our class names:
     *   * `AthleteDocument` → `AthleteDocuments`
     *   * `Category` → `Categories`
     *   * `Match` → `Matches`
     *   * `Bus` → `Buses`
     *
     * Anything more exotic (`Datum` → `Data`, `Person` → `People`)
     * should override via the static `$mockDataFile` property or
     * the interface constant.
     */
    private static function minimalPluraliser(string $singular): string
    {
        if (preg_match('/[^aeiou]y$/i', $singular) === 1) {
            return substr($singular, 0, -1) . 'ies';
        }

        if (preg_match('/(s|x|z|ch|sh)$/i', $singular) === 1) {
            return $singular . 'es';
        }

        return $singular . 's';
    }
}
