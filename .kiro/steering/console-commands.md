---
inclusion: fileMatch
fileMatchPattern: "**/Console/**/*.php"
---

# Console commands & OmniTerm output

Every Artisan command in this monorepo follows a single contract so the CLI
surface is uniform across `apps/api`, `apps/ai-service`, `apps/template`, and
every consumer package.

## The contract

Every command:

1. Extends `Academorix\Console\Console\Commands\BaseCommand` — **never**
   Laravel's `Illuminate\Console\Command` directly.
2. Carries a `#[Academorix\Console\Attributes\AsCommand(...)]` attribute —
   **never** Symfony's `Symfony\Component\Console\Attribute\AsCommand`. The
   Academorix one is a superset that supports the extension registry
   (`extends:`, `priority:`, `extensionDescription:`).
3. Uses `$this->omni` for **all** output. No `$this->info(...)`,
   `$this->error(...)`, `$this->warn(...)`, `$this->line(...)`. These still work
   (BaseCommand inherits them from Laravel) but produce visually inconsistent
   output that reads as "legacy" in review.
4. Resolves dependencies via **method injection on `handle()`** — **never** the
   constructor. Laravel's container calls `handle()` through `Container::call()`
   and resolves every type-hinted parameter automatically. Constructor DI works
   too but is wrong here (see the "Dependency injection" section below).

## Skeleton

```php
<?php

declare(strict_types=1);

namespace App\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;

#[AsCommand(
    name: 'domain:do-thing',
    description: 'One-line description of what this command does.',
)]
final class DoThingCommand extends BaseCommand
{
    // Only when the command has arguments / options.
    // Laravel still parses `{arg}` / `{--opt}` from this string.
    // The name portion duplicates the AsCommand attribute above so
    // both sources of truth stay aligned.
    protected $signature = 'domain:do-thing
        {target : What to operate on}
        {--dry-run : Preview without writing}';

    public function handle(): int
    {
        $this->omni->titleBar('Doing Thing', 'sky');

        $result = $this->omni->task('Processing …', function () {
            // work
            return ['state' => 'success', 'message' => 'Done'];
        });

        $this->omni->success('Completed');
        $this->showDuration();

        return self::SUCCESS;
    }
}
```

### Why keep `$signature` when we have the attribute?

The attribute carries `name` + `description` metadata (used by Symfony's Console
Application to register the command). Laravel's input definition (arguments +
options in the `{name : help}` DSL) is still parsed from `$signature`. When a
command has arguments or options, both must be present and their names must
match. When a command has **no** arguments or options, drop `$signature`
entirely and let the attribute be the sole source of truth.

### `$description` is always dropped

`$description` on the class is redundant with the attribute — always remove it.
If both are present and disagree, the attribute wins.

## Dependency injection

Commands resolve every dependency through **method injection on `handle()`**.
See
[laravel.com/docs/artisan#dependency-injection](https://laravel.com/docs/artisan#dependency-injection).

```php
public function handle(
    TenantRepositoryInterface $tenants,
    EventDispatcher $events,
): int {
    // work
}
```

The console kernel invokes `handle()` via
`Illuminate\Container\Container::call()`. Each type-hinted parameter is resolved
from the container at call time.

### Why NOT the constructor

Even though `extends BaseCommand extends Illuminate\Console\Command` supports
constructor injection, don't use it here:

- **Startup cost.** The console kernel instantiates _every_ registered command
  to discover its name and description — for `php artisan list`, for
  tab-completion, for scheduler booting. A constructor with heavy deps (services
  that themselves fan out into more services) resolves those deps every time,
  even when the command never runs. Method injection defers all of that to the
  actual `handle()` invocation.
- **Test ergonomics.** With method injection, a test passes mocks straight into
  `handle(…)`. With constructor injection you either rebuild the container or
  reach into private state.
- **Fewer moving parts.** No `parent::__construct()` bookkeeping, no readonly
  promoted-property fields whose only role is to shuttle a dep from constructor
  to `handle()`.

### The one exception

Constructor injection is acceptable only when a value is required by methods
that run _before_ `handle()` — for example, if you override `schedule()` to read
a service. That's rare. If you find yourself reaching for it, first ask whether
the logic belongs on a service instead.

## Skeleton — revised

The full pattern with method-injected deps looks like this:

```php
<?php

declare(strict_types=1);

namespace App\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use App\Contracts\TenantRepositoryInterface;

#[AsCommand(
    name: 'tenants:purge-expired',
    description: 'Permanently purge tenants past their GDPR retention window.',
)]
final class PurgeExpiredTenants extends BaseCommand
{
    public function handle(TenantRepositoryInterface $tenants): int
    {
        $this->omni->titleBar('Purge Expired Tenants', 'sky');

        $count = 0;
        foreach ($tenants->dueForPurge() as $tenant) {
            $this->omni->task(
                \sprintf('Purging %s', $tenant->id),
                fn () => $this->purgeOne($tenants, $tenant),
            );
            $count++;
        }

        $this->omni->success(\sprintf('Purged %d tenant(s).', $count));
        $this->showDuration();

        return self::SUCCESS;
    }
}
```

## Composer wiring

Every consumer package (module) that ships commands must add:

```json
{
  "require": {
    "academorix/console": "@dev"
  }
}
```

The path repository is already declared at the app level so no `repositories`
entry is needed on the consumer side. Run
`composer update academorix/console --working-dir=apps/<app>` after adding the
require.

## OmniTerm — how to output

`BaseCommand::initialize()` creates `$this->omni` (an
`Academorix\OmniTerm\OmniTerm` instance) before `handle()` runs. Use it for
every piece of output. The API is fluent and reads left to right.

### Cheat sheet — most-used methods

**Banner + section headers**

```php
$this->omni->titleBar('Purge Expired Tenants', 'sky');
$this->omni->divider('Phase 2 — permanent erasure');
$this->omni->hr();                            // horizontal rule
$this->omni->hrSuccess();                     // green rule
$this->omni->hrError();                       // red rule
$this->omni->newLine(2);                      // vertical whitespace
```

**Status blocks (framed, one-line)**

```php
$this->omni->success('Purged 3 tenants.');
$this->omni->info('No due tenants — nothing to do.');
$this->omni->warning('MinIO endpoint not reachable — retrying …');
$this->omni->error('Vendor rejected the request.');
$this->omni->disabled('Vector stores are OFF — set the flag.');
$this->omni->feedback('Custom message', 'CUSTOM', color: 'purple');
```

**Rich status (title + details + optional help lines)**

```php
$this->omni->statusSuccess('Tenants Purged', '3 of 4 due', help: ['Skipped 1 tenant with retained holds.']);
$this->omni->statusError('DB unreachable', 'connection refused (5432)');
$this->omni->statusWarning('Rate limited', 'retrying after 5s');
$this->omni->statusInfo('Dry run', 'no writes performed');
$this->omni->statusDisabled('Feature off', 'flag=false');
```

**Long-running work**

```php
// Spinner with automatic result banner:
$result = $this->omni->task('Uploading …', function () {
    // heavy lifting
    return ['state' => 'success', 'message' => 'uploaded 42 files'];
});

// Live task with progress updates you drive manually:
$live = $this->omni->liveTask('Backfilling embeddings');
foreach ($rows as $row) {
    $live->step(sprintf('row %d', $row->id));
    // work …
}
$live->success('done');
```

**Progress bars**

```php
$this->omni->createGradientProgressBar(count($items));
foreach ($items as $item) {
    // work …
    $this->omni->progressAdvance();
}
$this->omni->progressFinish();
```

**Data tables**

```php
$this->omni->tableHeader('Key', 'Value', 'Details');
$this->omni->tableRowSuccess('tenants_deleted', '3');
$this->omni->tableRowWarning('tenants_skipped', '1', 'held for compliance');
$this->omni->tableRowError('failed_batches', '0');
$this->omni->tableRow('duration_ms', 128);
```

**Data-list rendering (pretty-print an assoc array)**

```php
$this->omni->dataList(
    ['tenant_id' => $tenantId, 'store_id' => $storeId, 'name' => $name],
    title: 'Store Created',
);
```

**Interactive prompts**

```php
$driver = $this->omni->ask('Which driver?', options: ['sqlite', 'pgsql'], default: 'pgsql');
$choice = $this->omni->browse('Pick a tenant', $tenantList, scroll: 12);

$this->omni->confirm(
    'Purge 3 tenants permanently?',
    fn () => $service->purgeAll(),
    confirmColor: 'rose',
    declineColor: 'zinc',
);
```

**Debug dumps (dev-only)**

```php
$this->omni->debug($somePayload, label: 'incoming');
```

**Raw HTML (with Tailwind classes)**

```php
$this->omni->render(
    '<div class="ml-1 text-emerald-400">✓ warm cache</div>',
);
```

### Rules of thumb

- **Start every command with `titleBar()`** — the operator needs to know which
  command produced the output, especially in scripts that chain multiple
  commands.
- **End every successful command with `success()` (or `statusSuccess()`)
  followed by `$this->showDuration()`** — the duration line is the audit-log
  breadcrumb ops looks for.
- **End every failed command with `error()` (or `statusError()`)** — the framed
  red banner is easy to spot in a pipeline log.
- **Use `task()` for anything that might take more than 300 ms** — the spinner
  is what tells the operator "I didn't hang."
- **Use `tableRow*()` for structured summaries** — a "purged 3 tenants" line is
  fine for a small run; a run that touched 300 tenants belongs in a table so the
  operator can scan it.

## Anti-patterns

- ❌ `extends Command` — must be `extends BaseCommand`.
- ❌ `use Symfony\Component\Console\Attribute\AsCommand;` — must be
  `use Academorix\Console\Attributes\AsCommand;`.
- ❌ Constructor injection of runtime dependencies. Deps go on `handle()`'s
  signature. See the "Dependency injection" section above.
- ❌ `$this->info(...)`, `$this->error(...)`, `$this->warn(...)`,
  `$this->line(...)` for anything except stopgap output in a WIP command.
  Replace before merge.
- ❌ Keeping `$description` on the class — it's redundant with the attribute.
  Delete it.
- ❌ Setting `name` in `$signature` but forgetting the attribute — the extension
  registry never sees it and Symfony's discovery may lag.
- ❌ Duplicating logic between `handle()` and a service. Commands are thin —
  they orchestrate. Business logic lives in `src/<Domain>/Application/*`.
- ❌ Building queries or persisting Eloquent inside a command. Same rule as
  controllers: repositories only.
- ❌ Calling `sprintf(...)` unqualified when the compiler hints at it — use
  `\sprintf(...)` so the compiler can bind the built-in directly. Applies to
  every global function called from a namespaced file (`\sprintf`, `\count`,
  `\in_array`, `\is_string`, `\strlen`, …).

## Extending a base command

When another command should "hook into" a parent, use `AsCommand`'s extension
slots:

```php
#[AsCommand(
    name: 'di:clear',
    description: 'Clear DI compiled artifacts',
    extends: 'app:clear',
    priority: 60,                            // lower = runs earlier
    extensionDescription: 'DI compiled artifacts',
)]
final class ClearCompiledCommand extends BaseCommand { … }
```

The parent (`app:clear`) can then call `$this->extensions()` from its `handle()`
and delegate to every registered extension in order. Extensions are compiled at
build time (`di:compile`) into `bootstrap/cache/command-extensions.php` and
loaded on demand by `CommandExtensionRegistry`.

## Related steering

- `conventions.md` — general PHP + Laravel conventions (docblocks, strict types,
  service layering).
- `package-architecture.md` — package layout + layer rules that console commands
  live inside.
- `octane-first-di.md` — DI patterns that apply when a command resolves services
  from the container.
- `doppler.md` — every command that talks to real backends is invoked via
  `doppler run --` (composer scripts already do this).
