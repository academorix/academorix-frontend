# academorix/database

Data-layer building blocks for every Academorix module: base
model concerns, schema Blueprint macros, data-shaping attributes,
and tenant-aware cache tag helpers. Answers **"what the data
IS"** — pair with `academorix/crud` for **"how the data is
QUERIED"**.

## Package layout

```
src/
├── Attributes/                 — data-level attributes discovered by consumers
│   ├── Archivable.php
│   ├── AsDatabaseBlueprint.php  → marks a Schema macro registrar
│   ├── Metadatable.php
│   ├── Searchable.php           → Scout + SQL search config
│   ├── Sluggable.php
│   ├── SoftDeleteScope.php
│   ├── Sortable.php
│   ├── SortableModel.php
│   ├── StatusColumn.php
│   ├── Taggable.php
│   ├── Translatable.php         → Spatie translatable JSON columns
│   ├── UserStamped.php
│   └── UuidColumn.php
├── Cache/                      — tenant-aware cache-tag layer
│   ├── CacheTagBuilder.php
│   ├── TaggableCacheGuard.php   → degrades to untagged cache on file/db/array drivers
│   └── TenantAwareCacheTagResolver.php
├── Concerns/                   — model concern traits
│   ├── HasMetadata.php          → waad/laravel-model-metadata proxy
│   ├── HasMockableStorage.php   → Sushi-backed fixture models
│   ├── HasPrefixedUlid.php      → auto-fill `<prefix>_<ulid>` primary keys
│   ├── HasSystemFlag.php        → is_system column + scopes
│   ├── HasTranslations.php      → spatie/laravel-translatable proxy
│   ├── InteractsWithMedia.php   → spatie/laravel-medialibrary proxy
│   └── Model/                   — attribute-driven model behaviours
│       ├── HasArchive.php
│       ├── HasSlug.php
│       ├── HasSortOrder.php
│       ├── HasStatus.php
│       ├── HasTags.php
│       ├── HasUserStamp.php
│       └── HasUuid.php
├── Providers/
│   └── DatabaseServiceProvider.php
├── Schema/                     — Blueprint macros, all attribute-registered
│   ├── ArchivableBlueprint.php
│   ├── GpsableBlueprint.php
│   ├── MorphableBlueprint.php
│   ├── SluggableBlueprint.php
│   ├── SortableBlueprint.php
│   ├── SpatialLineStringBlueprint.php
│   ├── SpatialPointBlueprint.php
│   ├── SpatialPolygonBlueprint.php
│   ├── StatusableBlueprint.php
│   ├── TaggableBlueprint.php
│   ├── TranslatableBlueprint.php
│   ├── UserStampBlueprint.php
│   └── UuidableBlueprint.php
└── Support/
    ├── AttributeReader.php      → runtime attribute reader for model traits
    └── ClassAttributeView.php
```

## Public API

### Data attributes

Slap them on models (or on migrations, in the case of
`AsDatabaseBlueprint`):

- `#[Archivable(column: 'archived_at')]`
- `#[Metadatable(column: 'metadata')]`
- `#[Searchable(fields: [...], engine: 'meilisearch')]`
- `#[Sluggable(source: 'title')]`
- `#[SoftDeleteScope(includeDeleted: false)]`
- `#[Sortable(['name', 'price'])]` — request-driven sort allow-list
- `#[SortableModel(column: 'sort_order')]` — positional ordering
- `#[StatusColumn(enum: OrderStatus::class)]`
- `#[Taggable]`
- `#[Translatable(['name', 'description'])]`
- `#[UserStamped]`
- `#[UuidColumn(column: 'uuid')]`
- `#[AsDatabaseBlueprint(priority: 20)]` — Schema-macro registrar

### Model concerns

Compose them alongside the matching attribute:

- `HasArchive` ↔ `#[Archivable]`
- `HasSlug` ↔ `#[Sluggable]`
- `HasSortOrder` ↔ `#[SortableModel]`
- `HasStatus` ↔ `#[StatusColumn]`
- `HasTags` ↔ `#[Taggable]`
- `HasUserStamp` ↔ `#[UserStamped]`
- `HasUuid` ↔ `#[UuidColumn]`

And these standalone concerns (no attribute needed):

- `HasMetadata` — waad/laravel-model-metadata wrapper
- `HasMockableStorage` — fixture-backed model via Sushi
- `HasPrefixedUlid` — `<prefix>_<ulid>` primary key auto-fill
- `HasSystemFlag` — `is_system` column + `scopeSystem()` / `scopeCustom()`
- `HasTranslations` — spatie/laravel-translatable wrapper
- `InteractsWithMedia` — spatie/laravel-medialibrary wrapper

### Schema Blueprint macros

Registered automatically at boot via
`#[AsDatabaseBlueprint]` discovery:

```php
Schema::create('projects', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->translatable('name', 'description');
    $table->sluggable();
    $table->userStamp();
    $table->uuidable();
    $table->archivable();
    $table->timestamps();
});
```

### Cache tag helpers

```php
use Academorix\Database\Cache\CacheTagBuilder;

final class Repo
{
    public function __construct(private readonly CacheTagBuilder $tags) {}

    public function paged(int $page): mixed
    {
        return $this->cache->remember(
            $this->tags->for('athletes'),
            "athletes:page:{$page}",
            3600,
            fn () => Athlete::paginate(15, page: $page),
        );
    }
}
```

## Quick start

### 1. Install

```bash
composer require academorix/database
```

The service provider is auto-discovered — nothing to add to
`bootstrap/providers.php`.

### 2. Author a model

```php
namespace Academorix\Products\Models;

use Academorix\Database\Attributes\Searchable;
use Academorix\Database\Attributes\Sluggable;
use Academorix\Database\Attributes\Translatable;
use Academorix\Database\Concerns\HasTranslations;
use Academorix\Database\Concerns\Model\HasSlug;
use Illuminate\Database\Eloquent\Model;

#[Sluggable(source: 'name')]
#[Translatable(['name', 'description'])]
#[Searchable(fields: ['name', 'description'], engine: 'meilisearch')]
final class Product extends Model
{
    use HasSlug;
    use HasTranslations;

    /** @var list<string> */
    public array $translatable = ['name', 'description'];
}
```

### 3. Author a migration

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->translatable('name', 'description');
    $table->sluggable();
    $table->uuidable();
    $table->timestamps();
});
```

## Related

- Query surface (repositories, services, controllers): `academorix/crud`
- Service-provider base: `academorix/foundation`
- Attribute discovery runtime: `olvlvl/composer-attribute-collector`

## Testing

```bash
pnpm turbo run test --filter=@academorix/database
```
