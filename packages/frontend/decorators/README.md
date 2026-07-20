# @stackra/decorators

Centralised decorator library for the Stackra framework.

## Purpose

Feature packages that want to CONTRIBUTE a discoverable class or method (a
devtools panel, an analytics provider, an event listener, ...) should NOT need
to depend on the runtime package that OWNS the loader for that concern.
`@stackra/decorators` breaks the coupling.

- **Loader packages** (`@stackra/devtools`, `@stackra/events`, ...) own the
  runtime that reads stamped metadata via
  `discovery.getProvidersByMetadata(...)`.
- **`@stackra/decorators`** owns the stamping side — the class / method /
  property decorators that write the metadata.
- **`@stackra/contracts`** owns the metadata keys + options interfaces.

Result: a package like `@stackra/cache` can ship a `CacheDevtoolsPanel` by
importing `DevtoolsPanel` from `@stackra/decorators/devtools` without ever
loading `@stackra/devtools`.

## API — factories

Import from `@stackra/decorators/core`:

- `createDiscoverableClassDecorator(metadataKey, overrides?)` — class-level,
  auto-applies `@Injectable()`, stamps `options` under `metadataKey`. Optional
  secondary `discoveryKey` for a boolean marker.
- `createMetadataClassDecorator(metadataKey, overrides?)` — same as above but
  does NOT apply `@Injectable()`. Used for DTOs and policies (`@Setting`,
  `@CspPolicy`, `@Route`).
- `createDiscoverableMethodDecorator(methodMetadataKey, toOptions, overrides?)`
  — method-level. Stamps per-method options on the prototype. Optional
  `classDiscoveryKey` marker on the constructor so class-level discovery can
  find candidate classes.
- `createMapAccumulatorPropertyDecorator(metadataKey, overrides?)` —
  property-level. Maintains a `Map<propertyKey, Entry>` on the constructor with
  optional `toEntry` transform and `merge` strategy for repeated applications.
- `createMetadataReader(metadataKey)` — companion reader helper returning
  `{ get, has, hasOwn }`. Inheritance-aware.

## Domain wrappers

Each domain barrel exports the specific decorators for that concern:

- `@stackra/decorators/devtools` — `DevtoolsPanel`, `DevtoolsInspectorSource`,
  and their readers.

More domain wrappers land as their runtime packages get promoted.

## Inheritance semantics

Metadata is stored via `@vivtel/metadata` on top of `reflect-metadata`. Standard
`Reflect.getMetadata` semantics apply:

- **Class-level decorators**: subclass inherits parent's stamp through the
  prototype chain. Re-decorating the subclass writes to the subclass's own
  metadata slot — child wins for that class, parent's stamp remains untouched.
- **Method-level decorators**: metadata is stamped on the `prototype[method]`
  pair. If the subclass inherits the method (does NOT override), lookup walks
  the chain and finds the parent's stamp. If the subclass overrides +
  re-decorates, its own stamp wins for that method.
- **Property-level (Map-accumulator) decorators**: the Map lives on the
  constructor. Subclasses that re-decorate get their OWN Map; the parent's Map
  is unaffected. Domain readers can merge across the chain if needed via
  `hasOwnMetadata` + prototype walk.

## Why this package exists

Before: `@stackra/cache` imports `DevtoolsPanel` from `@stackra/devtools` just
to decorate its `CacheDevtoolsPanel` class. `@stackra/devtools` gets pulled in
as a runtime dependency purely for the decorator.

After: `@stackra/cache` imports from `@stackra/decorators/devtools`. Its
dependency chain is `contracts` + `container` + `decorators`.
`@stackra/devtools` remains an OPT-IN runtime package the app enables to
actually surface the panels.
