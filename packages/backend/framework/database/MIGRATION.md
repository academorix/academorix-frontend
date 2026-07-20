# Migration notes — academorix/database

Origin package split from `academorix/laravel-crud` per the "Model = what the
data IS, Repository = how the data is QUERIED" rule documented in
`old/crud/ARCHITECTURE.md`.

## Source → destination map

### From `old/crud/src/`

| Source                            | Destination                           |
| --------------------------------- | ------------------------------------- |
| `Attributes/Archivable.php`       | `src/Attributes/Archivable.php`       |
| `Attributes/Metadatable.php`      | `src/Attributes/Metadatable.php`      |
| `Attributes/Searchable.php`       | `src/Attributes/Searchable.php`       |
| `Attributes/Sluggable.php`        | `src/Attributes/Sluggable.php`        |
| `Attributes/SoftDeleteScope.php`  | `src/Attributes/SoftDeleteScope.php`  |
| `Attributes/Sortable.php`         | `src/Attributes/Sortable.php`         |
| `Attributes/SortableModel.php`    | `src/Attributes/SortableModel.php`    |
| `Attributes/StatusColumn.php`     | `src/Attributes/StatusColumn.php`     |
| `Attributes/Taggable.php`         | `src/Attributes/Taggable.php`         |
| `Attributes/Translatable.php`     | `src/Attributes/Translatable.php`     |
| `Attributes/UserStamped.php`      | `src/Attributes/UserStamped.php`      |
| `Attributes/UuidColumn.php`       | `src/Attributes/UuidColumn.php`       |
| `Concerns/Model/HasArchive.php`   | `src/Concerns/Model/HasArchive.php`   |
| `Concerns/Model/HasSlug.php`      | `src/Concerns/Model/HasSlug.php`      |
| `Concerns/Model/HasSortOrder.php` | `src/Concerns/Model/HasSortOrder.php` |
| `Concerns/Model/HasStatus.php`    | `src/Concerns/Model/HasStatus.php`    |
| `Concerns/Model/HasTags.php`      | `src/Concerns/Model/HasTags.php`      |
| `Concerns/Model/HasUserStamp.php` | `src/Concerns/Model/HasUserStamp.php` |
| `Concerns/Model/HasUuid.php`      | `src/Concerns/Model/HasUuid.php`      |
| `Schema/*.php` (13 files)         | `src/Schema/*.php`                    |

### From `old/backend/modules/reviewing/Foundation/src/`

| Source                                  | Destination                                 |
| --------------------------------------- | ------------------------------------------- |
| `Cache/CacheTagBuilder.php`             | `src/Cache/CacheTagBuilder.php`             |
| `Cache/TaggableCacheGuard.php`          | `src/Cache/TaggableCacheGuard.php`          |
| `Cache/TenantAwareCacheTagResolver.php` | `src/Cache/TenantAwareCacheTagResolver.php` |
| `Concerns/HasMetadata.php`              | `src/Concerns/HasMetadata.php`              |
| `Concerns/HasMockableStorage.php`       | `src/Concerns/HasMockableStorage.php`       |
| `Concerns/HasPrefixedUlid.php`          | `src/Concerns/HasPrefixedUlid.php`          |
| `Concerns/HasSystemFlag.php`            | `src/Concerns/HasSystemFlag.php`            |
| `Concerns/HasTranslations.php`          | `src/Concerns/HasTranslations.php`          |
| `Concerns/InteractsWithMedia.php`       | `src/Concerns/InteractsWithMedia.php`       |

### Net-new in this package

| File                                        | Reason                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/Attributes/AsDatabaseBlueprint.php`    | Local port of the marker previously in `academorix/laravel-database`. Consumed by `DatabaseServiceProvider` for Blueprint macro auto-registration.   |
| `src/Providers/DatabaseServiceProvider.php` | New — Laravel service provider that runs the macro-registration pass.                                                                                |
| `src/Support/AttributeReader.php`           | Runtime attribute-reader shim replacing `Pixielity\Discovery\Facades\Discovery::forClass()`. Uses `ReflectionClass::getAttributes()` under the hood. |
| `src/Support/ClassAttributeView.php`        | Value object returned by `AttributeReader::forClass()`.                                                                                              |

## Namespace changes

| Old namespace                                            | New namespace                                          |
| -------------------------------------------------------- | ------------------------------------------------------ |
| `Academorix\Crud\Attributes\{data attrs}`                | `Academorix\Database\Attributes\{name}`                |
| `Academorix\Crud\Concerns\Model\{name}`                  | `Academorix\Database\Concerns\Model\{name}`            |
| `Academorix\Crud\Schema\{name}`                          | `Academorix\Database\Schema\{name}`                    |
| `Academorix\Database\Attributes\AsDatabaseBlueprint`     | `Academorix\Database\Attributes\AsDatabaseBlueprint`   |
| `Academorix\Foundation\Cache\{name}`                     | `Academorix\Database\Cache\{name}`                     |
| `Academorix\Foundation\Concerns\HasMetadata` (+ friends) | `Academorix\Database\Concerns\HasMetadata` (+ friends) |

## Discovery mechanism change

- **Old**: `academorix/laravel-discovery` / `pixielity/laravel-discovery`
  runtime facade (`Discovery::attribute(X::class)->get()`,
  `Discovery::forClass($class)`). Cached class map with dot-shorthand facade
  access.
- **New**: `olvlvl/composer-attribute-collector`. Attribute targets are compiled
  to `vendor/attributes.php` at `composer dump-autoload` time and exposed via
  `Attributes::findTargetClasses(X::class)`. The class-keyed reverse lookup used
  by Model concern traits (`Discovery::forClass(...)`) has no direct olvlvl
  counterpart — see `src/Support/AttributeReader.php` for the compatibility shim
  that mirrors the ergonomics using `ReflectionClass::getAttributes()`.

## TODOs

- **`Attributes/Taggable.php`** — the `$tagModel` default is
  `'Academorix\\Crud\\Models\\Tag'`. `Academorix\Crud\Models\Tag` is a phantom
  reference — the old codebase also carried this default without providing the
  class. Consumer apps override with their own tag model via
  `#[Taggable(tagModel: MyTag::class)]`. Same phantom reference appears in
  `Schema/TaggableBlueprint.php` (docblock only) and
  `Concerns/Model/HasTags.php` (default fallback in the runtime resolver).
