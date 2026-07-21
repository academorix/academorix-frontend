---
inclusion: fileMatch
fileMatchPattern: "**/{Bootstrappers,Registry,Discovery}/**/*.php"
---

# Discovery — the one true attribute-scan pattern

Every module that publishes discoverable classes (personas, tools, retention
policies, permissions, settings, health checks, cache-tag resolvers, routes,
event listeners, seeders, blueprints, scheduled tasks) follows the SAME wiring.
This file is the canonical contract. Deviations become bugs.

## Location

Discoverers live in `<module>/src/Bootstrappers/` — they ARE bootstrappers
(subclasses of `AbstractBootstrapper`), just with one specific job: scan
`#[AsX]` and hydrate a registry. The registries they hydrate live in
`<module>/src/Registry/`. Every registry extends
`Stackra\ServiceProvider\Registry\AbstractRegistry`.

See `.kiro/steering/folder-conventions.md` for the locked per-folder ownership
table + the anti-pattern catalogue (in particular: registries never in
`Support/`, never in `Services/`).

## The seam — `DiscoversAttributes`

`Stackra\Foundation\Contracts\DiscoversAttributes` is the ONLY interface any
bootstrapper touches to walk `#[AsX]` classes. Production binds
`Stackra\Foundation\Discovery\AttributeDiscovery`, which wraps
`olvlvl/composer-attribute-collector`'s `vendor/attributes.php` manifest. Tests
bind a hand-built fake.

```php
public function __construct(
    private readonly DiscoversAttributes $discovery,
) {}

// in populate():
foreach ($this->discovery->forClass(AsPersona::class) as $target) {
    // $target->className — the FQCN carrying the attribute
    // $target->attribute — the hydrated attribute instance
    $this->registry->register($target->className, $target->attribute);
}
```

**Never** call `olvlvl\ComposerAttributeCollector\Attributes` directly from
module code. That's a leak of a specific backend into consumer code. Every
discovery flows through `DiscoversAttributes`.

## The bootstrapper shape

One class per discovery concern. Every discovery is a subclass of
`Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper`. See
`.kiro/steering/bootstrappers.md` for the full contract.

```php
#[Singleton]
final class PersonaBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly PersonaRegistry $registry,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    public function name(): string
    {
        return 'ai.personas';
    }

    public function priority(): int
    {
        return 120; // domain modules: 100..199
    }

    public function populate(): void
    {
        $discovered = 0;
        foreach ($this->discovery->forClass(AsPersona::class) as $target) {
            // 1. Skip disabled entries
            if ($target->attribute->enabled === false) {
                continue;
            }

            // 2. Reflection-verify the discovered class is what we expect
            try {
                $reflection = new \ReflectionClass($target->className);
            } catch (\ReflectionException $e) {
                $this->log->warning('persona discovery: unreadable class', [
                    'class' => $target->className,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            if (! $reflection->implementsInterface(Agent::class)) {
                $this->log->warning('persona discovery: class does not implement Agent', [
                    'class' => $target->className,
                ]);
                continue;
            }

            // 3. Register with the domain registry
            $this->registry->register($target->className, $target->attribute);
            $discovered++;
        }

        $this->log->info('persona discovery complete', ['count' => $discovered]);
    }
}
```

## Non-negotiable rules

1. **One bootstrapper per discovery concern.** Personas, tools, drafts, agent
   middleware — each gets its own bootstrapper class. Never merge two concerns
   into one class "because they're related" — priority + cache key + logging
   identity all belong to one concern.
2. **`#[Singleton]` on every bootstrapper.** Discovery is a pure function of the
   composer manifest — same output every call, safe to share across requests.
3. **Constructor-inject via container attributes only.** No facades, no `app()`
   calls inside the bootstrapper body. See `.kiro/steering/octane-first-di.md`.
4. **Skip `enabled === false` entries.** The attribute's `enabled` flag exists
   for feature-flagging classes without deleting them — every discoverer honors
   it.
5. **Reflection-verify before registering.** If the attribute says "I'm a
   persona" but the class doesn't `implements Agent`, log a WARNING and skip.
   Fail-soft — never throw at boot time.
6. **Never fail-fast at boot.** A single misconfigured class must not halt the
   app. Every discoverer catches per-target exceptions, logs them, and
   continues.
7. **Log INFO summary at completion.** One line:
   `<domain> discovery complete { count: N }`. Ops depends on these lines to
   know discovery ran and how many entries landed.
8. **Idempotency.** `populate()` may be called multiple times in tests.
   Registries must handle duplicate registration gracefully (either ignore or
   throw a `LogicException` with the two colliding FQCNs — pick one and document
   it in the registry's class docblock).

## Cache hydration

The base `AbstractBootstrapper` handles cache. Every bootstrapper that's
cheap-to-serialize (a `list<class-string>` or a `map<string, class-string>`)
implements the pair:

```php
protected function toCachePayload(): mixed
{
    // Return a serializable dump of what populate() built.
    // Return null (default) to disable caching for this bootstrapper.
    return $this->registry->all();
}

protected function fromCachePayload(mixed $payload): bool
{
    // Rehydrate the registry from the cached payload.
    // Return true when handled (skip populate).
    // Return false when the payload is stale/invalid (fall through to populate).
    if (! is_array($payload)) {
        return false;
    }

    foreach ($payload as $className => $attributeState) {
        $this->registry->register($className, $attributeState);
    }

    return true;
}
```

**Cache misses call `populate()`. Cache hits skip it.** The base class handles
the cache dance; subclasses just answer the two serialization questions.

## Test doubles

Every consumer package ships an `InMemoryDiscoversAttributes` fake under its
`tests/Support/`. Tests bind it to the container in `beforeEach()`:

```php
beforeEach(function (): void {
    $this->app->bind(DiscoversAttributes::class, function () {
        $fake = new InMemoryDiscoversAttributes();
        $fake->registerTarget(AsPersona::class, CoachAssistantPersona::class, new AsPersona(slug: 'coach'));
        $fake->registerTarget(AsPersona::class, ParentAssistantPersona::class, new AsPersona(slug: 'parent'));
        return $fake;
    });
});
```

Then the test resolves the bootstrapper and runs `populate()` directly,
asserting the registry contains exactly the fixtures. Never touches
`vendor/attributes.php`; never depends on composer autoload state.

## Anti-patterns

- ❌ Directly calling
  `olvlvl\ComposerAttributeCollector\Attributes::findTargetClasses(...)` inside
  a service or bootstrapper. Route through `DiscoversAttributes`.
- ❌ Bootstrapper populates multiple registries. One class, one registry.
- ❌ Bootstrapper throws when a class doesn't match the expected interface.
  Log + skip.
- ❌ Bootstrapper reads request/session/user state. Bootstrappers are app-boot;
  there's no request in flight.
- ❌ Registration order affects semantics. If two entries collide (same key),
  the registry throws with both FQCNs; the fix is to rename one, not to rely on
  discovery order.
- ❌ Re-instantiating a bootstrapper mid-request. Singleton — one per worker —
  populated once at boot.
- ❌ Making a bootstrapper's `populate()` depend on another bootstrapper's
  registry state. Bootstrappers are pure functions of
  `(discovered classes, container)`. If ordering matters, use `priority()` and
  STILL don't cross-read registries — read the underlying discovery source.
- ❌ Duplicating discovery logic across modules ("we scan `AsAiTool` in the tool
  registry AND in the persona resolver"). One bootstrapper, one registry, every
  consumer reads the registry.

## Related steering

- `.kiro/steering/bootstrappers.md` — the abstract base class + registration +
  cache lifecycle
- `.kiro/steering/php-attributes.md` — how to author the `#[AsX]` attributes
  bootstrappers scan
- `.kiro/steering/octane-first-di.md` — why bootstrappers are `#[Singleton]` and
  their registries too
- `.kiro/steering/tenancy-hooks.md` — sibling pattern for per-tenant lifecycle
  work (NOT for discovery)
