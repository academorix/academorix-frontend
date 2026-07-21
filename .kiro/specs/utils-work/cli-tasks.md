# CLI Tasks

Recreate the full CLI application at `tools/cli/`. 57 files, ~7,689 lines of
PHP + JSON + shell. Symfony Console 7.2 + Laravel Prompts 0.3 + Illuminate
Container/Filesystem/View + `pdphilip/omniterm ^3.0`.

**File-tree ownership**: `tools/cli/**` (except `tools/cli/src/Stubs/stubs/**`
which is owned by `stubs-tasks.md`).

**Depends on**: `omniterm-tasks.md` (for `UsesOmniTerm` trait wiring).
Everything else in this file can be authored in parallel with the other Wave 2
sub-files.

**No git operations.**

---

## 1. Package skeleton (5 files)

### 1.1 `tools/cli/composer.json`

```json
{
  "name": "stackra/cli",
  "description": "Stackra workspace CLI — scaffolds projects, packages, and modules.",
  "type": "library",
  "license": "proprietary",
  "require": {
    "php": "^8.3",
    "symfony/console": "^7.2",
    "laravel/prompts": "^0.3",
    "pdphilip/omniterm": "^3.0",
    "illuminate/container": "^11.0",
    "illuminate/filesystem": "^11.0",
    "illuminate/events": "^11.0",
    "illuminate/view": "^11.0",
    "illuminate/support": "^11.0",
    "symfony/process": "^7.2",
    "symfony/finder": "^7.2"
  },
  "require-dev": {
    "phpstan/phpstan": "^1.11",
    "phpunit/phpunit": "^11.0"
  },
  "autoload": {
    "psr-4": { "Stackra\\Cli\\": "src/" },
    "files": ["src/helpers.php"]
  },
  "bin": ["bin/stackra"]
}
```

The `src/helpers.php` file is authored by `omniterm-tasks.md` (contains the
global `view()` helper).

### 1.2 `tools/cli/bin/stackra`

PHP entry point, executable (`chmod +x`).

```php
#!/usr/bin/env php
<?php
declare(strict_types=1);

$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    fwrite(STDERR, "Run `composer install` in tools/cli first.\n");
    exit(1);
}
require $autoload;

use Stackra\Cli\Application;

exit((new Application())->run());
```

### 1.3 `tools/cli/phpstan.neon`

Level `max`. Include `src/`. Exclude `vendor/`.

### 1.4 `tools/cli/phpunit.xml`

Standard PHPUnit XML. Test suite `Unit` at `tests/Unit`, `Feature` at
`tests/Feature`. Bootstrap `vendor/autoload.php`.

### 1.5 `tools/cli/README.md`

- Purpose
- Installation (`composer install --working-dir=tools/cli`)
- Commands table (10 rows — see §12)
- Development notes (regenerate autoload with `composer dump-autoload`)

---

## 2. Application core (3 files)

### 2.1 `tools/cli/src/Application.php`

Extends `Symfony\Component\Console\Application`. Responsibilities:

- Set name `"Stackra CLI"`, version `"0.1.0"`
- Instantiate the DI container in constructor
- Register all 10 commands (§12) via `add()`
- Handle uncaught exceptions with `HandlesErrors` trait renderer

Constructor signature:

```php
public function __construct()
{
    parent::__construct('Stackra CLI', '0.1.0');
    $this->container = new Container();
    foreach ($this->buildCommands() as $command) {
        $this->add($command);
    }
}
```

### 2.2 `tools/cli/src/Container.php`

Wraps `Illuminate\Container\Container`. Wires 7 services (bindings shown as
interfaces + concretes):

| Binding                                    | Concrete           |
| ------------------------------------------ | ------------------ |
| `Illuminate\Filesystem\Filesystem`         | itself (singleton) |
| `Stackra\Cli\Catalog\CatalogReader`     | itself             |
| `Stackra\Cli\Catalog\CatalogQuery`      | itself             |
| `Stackra\Cli\Stubs\StubRegistry`        | itself             |
| `Stackra\Cli\Stubs\StubRenderer`        | itself             |
| `Stackra\Cli\Templates\TemplateManager` | itself             |
| `Stackra\Cli\Blueprint\BlueprintReader` | itself             |

Constructor runs `Bootstrap\ViewBootstrapper::boot($this)` — see
`omniterm-tasks.md`. The View factory + omniterm view namespace are wired here
so `view('omniterm::...')` works standalone.

### 2.3 `tools/cli/src/Commands/AbstractCommand.php`

Base class every concrete command extends. Composes ALL 14 concern traits via
`use` statements. Signature:

```php
abstract class AbstractCommand extends \Symfony\Component\Console\Command\Command
{
    use RendersBrandArt;
    use UsesLaravelPrompts;
    use UsesOmniTerm;
    use UsesCatalog;
    use UsesStubs;
    use UsesTemplates;
    use UsesBlueprint;
    use UsesFormatters;
    use UsesComposer;
    use UsesPnpm;
    use UsesGit;
    use UsesFilesystem;
    use HandlesErrors;
    use ValidatesInput;

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $this->initialize($input, $output);
            if ($this->shouldRenderBanner()) {
                $this->renderBrandArt($output);
            }
            return $this->handle($input, $output);
        } catch (\Throwable $e) {
            return $this->renderFatalError($e, $output);
        }
    }

    abstract protected function handle(InputInterface $input, OutputInterface $output): int;
}
```

`shouldRenderBanner()` returns
`$output->isDecorated() && !$input->hasOption('--no-banner')`.

---

## 3. Concern traits (14 files) under `tools/cli/src/Concerns/`

### 3.1 `RendersBrandArt.php`

Owns the STACKRA ASCII banner + 11 gradient palettes. The banner is 6
block-figlet lines spelling STACKRA. Per-line color drawn from a palette
picked at random. Palettes to include (11):

- `red`, `gray`, `ocean`, `vaporwave`, `sunset`, `aurora`, `ember`, `cyberpunk`,
  `emerald`, `azure`, `royal`

Each palette is 6 integers in the ANSI 256-color range. Method:
`renderBrandArt(OutputInterface $output): void`.

### 3.2 `UsesLaravelPrompts.php`

Thin wrappers around
`Laravel\Prompts\{text, password, select, multiselect, confirm, search, suggest, spin}`.
Methods:

- `askText(label, default = null, required = true): string`
- `askSelect(label, options, default = null): string`
- `askMultiselect(label, options, defaults = []): array`
- `askConfirm(label, default = true): bool`
- `askPassword(label): string`
- `spin(message, callback): mixed`

All wrappers auto-fallback to defaults in non-interactive mode.

### 3.3 `UsesOmniTerm.php`

Declared here — full spec in `omniterm-tasks.md`. Provides
`public OmniTerm $omni` populated in `initialize()`.

### 3.4 `UsesCatalog.php`

Delegates to `CatalogReader` + `CatalogQuery`. Methods:

- `catalog(): CatalogReader`
- `findPackagesForCapability(capability): CatalogEntry[]`
- `packagesByTier(tier): CatalogEntry[]`
- `resolveSelection(capabilities): CatalogSelection`

### 3.5 `UsesStubs.php`

Thin wrapper around `StubRenderer`. Method:

- `renderStub(logicalName, outputPath, tokens): void`

### 3.6 `UsesTemplates.php`

Delegates to `TemplateManager`. Methods:

- `cloneTemplate(kind, destination, tokens): void`

### 3.7 `UsesBlueprint.php`

Delegates to `BlueprintReader` + `BlueprintValidator`. Methods:

- `readBlueprint(moduleName): array`
- `validateBlueprints(): array`

### 3.8 `UsesFormatters.php`

Post-emit format dispatch. Maps file extension → formatter:

- `.php` → `pint --preset=laravel`
- `.tsx` / `.ts` / `.mjs` / `.cjs` / `.js` → `prettier --write`
- `.json` / `.jsonc` → `prettier --parser=json`
- `.md` → `prettier --parser=markdown`
- `.yml` / `.yaml` → `prettier --parser=yaml`

Method: `formatFile(path): void`. Skips silently if formatter isn't available on
PATH.

### 3.9 `UsesComposer.php`

Wraps composer subcommands via `ProcessRunner`:

- `composerInstall(cwd): void`
- `composerRequire(cwd, package, version = null): void`
- `composerDumpAutoload(cwd): void`

### 3.10 `UsesPnpm.php`

Wraps pnpm subcommands:

- `pnpmInstall(cwd): void`
- `pnpmAdd(cwd, packages): void`
- `pnpmRun(cwd, script): void`

### 3.11 `UsesGit.php`

Wraps git subcommands (READ-ONLY plus init):

- `gitInit(cwd): void`
- `gitCurrentBranch(cwd): ?string`
- `gitStatus(cwd): string`
- **NEVER**: `git commit`, `git push`, `git stash`, `git reset --hard`

### 3.12 `UsesFilesystem.php`

Wraps `Illuminate\Filesystem\Filesystem` for common ops:

- `readFile(path): string`
- `writeFile(path, contents): void`
- `ensureDir(path): void`
- `copyDir(src, dest): void`
- `deleteFile(path): void`

### 3.13 `HandlesErrors.php`

Central exception rendering. Method:

- `renderFatalError(Throwable $e, OutputInterface $output): int`

Dispatches on exception class:

- `CliException` subclasses → use `headline()` + `remediation()` + `exitCode()`
  on the exception
- Any other `Throwable` → render as "Unexpected error" via
  `$this->omni->statusError()`

### 3.14 `ValidatesInput.php`

Input validation helpers:

- `assertValidProjectName(name): void` — must be kebab-case, 2-30 chars
- `assertValidModuleName(name): void` — `<tier>/<slug>` shape
- `assertDirectoryDoesNotExist(path): void` — for new project scaffolding
- `assertDirectoryExists(path): void` — for existing-project commands

Each throws a `CliException` subclass with the right factory.

---

## 4. Support classes (5 files) under `tools/cli/src/Support/`

### 4.1 `Palette.php`

Constants for the 11 gradient palettes (see `RendersBrandArt`). Each is a
`readonly array<int, int>` of 6 ANSI 256-color values.

### 4.2 `Gradient.php`

Static methods for ANSI escape codes:

- `fg256(int $color): string` — foreground
- `bg256(int $color): string` — background
- `truecolor(int $r, int $g, int $b): string`
- `reset(): string`

### 4.3 `PathResolver.php`

Locates key paths from the current working directory upward:

- `workspaceRoot(): string` — finds nearest ancestor with `pnpm-workspace.yaml`
- `packageRoot(cwd): string` — finds nearest ancestor with `package.json`
- `templatesRoot(): string` — `<workspaceRoot>/templates/`
- `catalogRoots(): string[]` — `<workspaceRoot>/packages/{backend,frontend}/**`

### 4.4 `ProcessRunner.php`

Wraps `Symfony\Component\Process\Process`. Method:

- `run(array $command, string $cwd, ?callable $onOutput = null): int`

Streams stdout/stderr live when a callback is supplied. Throws
`CliException::forSubprocessFailure(...)` on non-zero exit.

### 4.5 `Console.php`

Static helpers around Symfony Console I/O:

- `arg(InputInterface $input, string $name): ?string`
- `opt(InputInterface $input, string $name): ?string`
- `verbosity(OutputInterface $output): int`

---

## 5. Exceptions (5 files) under `tools/cli/src/Exceptions/`

### 5.1 `CliException.php`

Base exception. Every subclass carries:

- `headline(): string` — one-line title for the error card
- `remediation(): string[]` — bullet-list "how to fix" steps
- `exitCode(): int` — process exit code (2 for user errors, 3 for environment
  errors, 4 for subprocess failures)

Named factories (all `public static`):

- `forInvalidProjectName(name): self`
- `forExistingProjectDir(path): self`
- `forMissingWorkspaceRoot(): self`
- `forSubprocessFailure(command, exitCode, stderr): self`
- `forInvalidJson(path, error): self`
- `forInvalidYaml(path, error): self`
- `forMissingFile(path): self`
- `forMissingDirectory(path): self`
- `forPermissionDenied(path): self`
- `forMissingBinary(name): self`

### 5.2 `CatalogException.php extends CliException`

Named factories:

- `forMissingCatalogEntry(pkgName): self`
- `forInvalidCatalogEntry(path, field, reason): self`
- `forEmptyCatalog(searchRoots): self`

### 5.3 `StubException.php extends CliException`

Named factories:

- `forMissingStub(logicalName): self`
- `forMissingStubFile(path): self`
- `forMissingToken(stubName, tokenName): self` — used only in strict mode

### 5.4 `TemplateException.php extends CliException`

Named factories:

- `forMissingTemplateDir(kind): self`
- `forInvalidTemplateKind(kind, valid): self`
- `forDestinationExists(path): self`

### 5.5 `BlueprintException.php extends CliException`

Named factories:

- `forMissingModuleBlueprint(moduleName): self`
- `forInvalidBlueprintShape(moduleName, field, reason): self`
- `forValidatorFailure(stderr): self` — wraps `validate-module-graph.py --json`
  failures

---

## 6. Catalog subsystem (4 files) under `tools/cli/src/Catalog/`

### 6.1 `CatalogEntry.php`

Read-only DTO. Fields mapping the `catalog.v1.json` schema exactly:

- `name: string` — `stackra/foo` or `@stackra/foo`
- `tier: 'foundation' | 'framework' | 'saas' | 'domain'`
- `surfaces: string[]` — subset of `['core', 'react', 'native', 'testing']`
- `kind: 'framework-plumbing' | 'sdk' | 'feature' | 'tooling'`
- `purpose: string` — max 200 chars
- `capabilities: string[]` — each max 100 chars
- `whenToUse: ?string`
- `whenNotToUse: ?string`
- `peerDeps: string[]`
- `backendPair: ?string`
- `sizeGzipKb: array<string, float>`
- `maturity: 'alpha' | 'beta' | 'stable'`
- `owningAgent: ?string`
- `docs: string[]` — relative paths

Static factory: `fromArray(array $raw, string $sourcePath): self`. Throws
`CatalogException::forInvalidCatalogEntry(...)` on missing required fields.

### 6.2 `CatalogReader.php`

Walks `<workspaceRoot>/packages/{backend,frontend}/**/catalog.json` (via
`PathResolver::catalogRoots()`), reads each with `Filesystem`, decodes JSON,
wraps in `CatalogEntry::fromArray()`. Method:

- `all(): CatalogEntry[]`
- `byName(name): ?CatalogEntry`
- `byTier(tier): CatalogEntry[]`

Internal aggregation is lazy — first call populates a static array; further
calls hit the cache.

### 6.3 `CatalogQuery.php`

Higher-level lookups on top of `CatalogReader`.

**25 curated capability groups** (each is `{label, capabilities[]}`):

- Auth & identity
- Multi-tenancy
- Access control (roles/permissions)
- Approvals + delegation
- HTTP + APIs
- Realtime + websockets
- Data storage
- Caching
- Job queue
- Task scheduling
- Notifications (in-app/mail/sms/push)
- Analytics
- Monitoring + observability
- Audit trails
- Activity feeds
- Feature flags
- Search
- i18n
- Media / storage
- Payments + subscriptions
- Entitlements
- Consent management
- Terminal UI (CLI/console)
- AI orchestration
- Testing utilities

**5 business-type default sets**:

- `salon` — Auth, Tenancy, Booking, Notifications, Payments
- `gym` — same as salon + Passes + Memberships
- `academy` — Tenancy, Auth, Enrollments, Coaching, Teams, Payments
- `clinic` — Tenancy, Auth, Appointments, Medical records, Consent
- `custom` — empty defaults

Methods:

- `allCapabilityGroups(): array<string, string>` — label → key
- `defaultsForBusinessType(type): string[]`
- `resolvePackages(capabilities): CatalogSelection`
- `businessTypes(): array<string, string>`

### 6.4 `CatalogSelection.php`

Result of a resolve call. Read-only DTO holding deduplicated `CatalogEntry[]`
and helper methods:

- `all(): CatalogEntry[]`
- `count(): int`
- `byTier(tier): CatalogEntry[]`
- `hasPackage(name): bool`

---

## 7. Stub subsystem (3 files) under `tools/cli/src/Stubs/`

The stub FILES themselves (all 69) are owned by `stubs-tasks.md`. This task owns
the three service classes:

### 7.1 `StubRegistry.php`

Maps ~30+ logical names to relative stub paths under `stubs/`. Example entries:

```php
'php.action'            => 'php/action.stub',
'php.model'             => 'php/model.stub',
'php.model-interface'   => 'php/model-interface.stub',
'react.page-list'       => 'react/page-list.stub',
'react.component'       => 'react/component.stub',
'native.screen'         => 'native/screen.stub',
'docs.adr'              => 'docs/adr.stub',
// ... complete list per stubs-tasks.md §Registry entries
```

Method: `pathFor(logicalName): string` — returns absolute path, throws
`StubException::forMissingStub(...)` if unknown.

### 7.2 `StubFormatter.php`

Dispatches to `UsesFormatters` after emit. Method:

- `format(path): void` — internally calls the concern trait's `formatFile()`.

### 7.3 `StubRenderer.php`

Token substitution engine. Method:

- `render(string $stubPath, string $outputPath, array $tokens, bool $strict = false): void`

Reads stub, replaces `{{ tokenName }}` placeholders, writes output, then calls
`StubFormatter::format()`.

Strict mode: throws `StubException::forMissingToken(...)` on any unreplaced
marker.

Lenient mode (default): leaves unreplaced markers as `{{ MISSING:name }}` so the
developer sees them in the emitted file.

---

## 8. Template subsystem (3 files) under `tools/cli/src/Templates/`

### 8.1 `TemplateRegistry.php`

Maps template kinds to source directories:

- `'backend-app'` → `<workspaceRoot>/templates/backend-app/`
- `'web-app'` → `<workspaceRoot>/templates/web-app/`
- `'mobile-app'` → `<workspaceRoot>/templates/mobile-app/`

Method: `directoryFor(kind): string` — throws
`TemplateException::forMissingTemplateDir(...)` if the source directory doesn't
exist yet (v0.1 ships without templates; that's expected).

### 8.2 `TemplateHydrator.php`

Walks a source directory, applies token substitution to every text file, copies
binary files unchanged. Binary detection: read first 512 bytes, count
non-printable characters — if >30%, treat as binary.

Method: `hydrate(sourceDir, destDir, tokens): void`.

### 8.3 `TemplateManager.php`

Orchestrator. Method:

- `clone(kind, destination, tokens, onPostInstall = null): void`

Steps: `TemplateRegistry::directoryFor()` → `TemplateHydrator::hydrate()` →
optional post-install hook (e.g. run `composer install` for backend-app,
`pnpm install` for web-app).

---

## 9. Blueprint subsystem (2 files) under `tools/cli/src/Blueprint/`

### 9.1 `BlueprintReader.php`

Reads `<workspaceRoot>/modules/<moduleName>/**.json` (30-ish JSON files per
module — see `.ref/DOMAIN_MODULES_BLUEPRINT.md`). Method:

- `read(moduleName): array` — deep-merges every JSON file into a single
  associative array keyed by base filename (`module.json` → `'module'`,
  `routes.json` → `'routes'`, etc.).

### 9.2 `BlueprintValidator.php`

Shells to the workspace-root Python validator via `ProcessRunner`:

```
python3 modules/shared/blueprints/foundation/scripts/validate-module-graph.py --json
```

Method: `validate(): array` — returns the JSON validation report. Throws
`BlueprintException::forValidatorFailure(...)` on non-zero exit.

---

## 10. Root `src/` files

### 10.1 `tools/cli/src/helpers.php`

Global `view()` helper. Full spec in `omniterm-tasks.md`. Autoloaded via
`composer.json` `autoload.files`.

### 10.2 `tools/cli/src/Bootstrap/ViewBootstrapper.php`

Full spec in `omniterm-tasks.md`. Wires Illuminate View factory + omniterm view
namespace into the container.

---

## 11. Application-level output helpers (already covered by traits)

Every command uses `$this->omni->titleBar(...)`, `$this->omni->success(...)`,
`$this->omni->tableHeader(...)`, `$this->omni->tableRow(...)`,
`$this->omni->task(...)`, `$this->omni->progressBar(...)`, etc. — all vendored
from `pdphilip/omniterm` v3 (see `omniterm-tasks.md`).

---

## 12. Commands (10 files) under `tools/cli/src/Commands/`

### 12.1 Full commands (4)

#### `NewProjectCommand.php`

- **Signature**:
  `stackra new <name> [--preset=<business-type>] [--no-banner]`
- **Purpose**: Bootstrap a new Stackra project.
- **Flow**:
  1. Validate project name (`ValidatesInput::assertValidProjectName`)
  2. Assert destination doesn't exist
     (`ValidatesInput::assertDirectoryDoesNotExist`)
  3. Interactive prompts (Laravel Prompts):
     - Business type (default from `--preset`)
     - Reference product (URL, optional)
     - Capabilities multiselect (from `CatalogQuery::allCapabilityGroups()`
       - `defaultsForBusinessType()`)
  4. Resolve packages: `CatalogQuery::resolvePackages(capabilities)`
  5. Show selection as OmniTerm titleBar + tableHeader + tableRow loop (one row
     per package, columns: Tier, Package, Reason)
  6. `askConfirm('Proceed?')`
  7. Clone template(s): backend-app + web-app + mobile-app under `<name>/`
  8. Install packages: composer for backend, pnpm for web + mobile
  9. Show `statusSuccess("Project ready", ...)` with next steps

#### `MakeActionCommand.php`

- **Signature**:
  `stackra make:action <ClassName> --module=<tier/name> --verb=<Http> --route=<path>`
- **Purpose**: Emit a single Laravel action from `php/action.stub`.
- **Flow**:
  1. Validate module (`ValidatesInput::assertValidModuleName`)
  2. Assert workspace root exists (composer project)
  3. Resolve namespace from module path
  4. Render `php.action` stub with tokens (className, namespace, verb, route,
     module, description)
  5. Output path: `packages/backend/<tier>/<name>/src/Actions/<ClassName>.php`
  6. Show `statusSuccess` with next steps (write test, wire route)

#### `CatalogListCommand.php`

- **Signature**: `stackra catalog:list [--tier=<t>] [--surface=<s>]`
- **Purpose**: List every catalog entry.
- **Flow**:
  1. Read catalog via `CatalogReader::all()`
  2. Filter by `--tier` / `--surface` if provided
  3. Render OmniTerm `titleBar("Catalog — N entries")`
  4. `tableHeader('Package', 'Purpose')`
  5. Loop entries → `tableRow(name, purpose)` — truncate purpose to terminal
     width

#### `CatalogSearchCommand.php`

- **Signature**: `stackra catalog:search <query> [--tier=<t>]`
- **Purpose**: Search by capability substring.
- **Flow**:
  1. `CatalogQuery::resolvePackages([...])` with the query
  2. If zero hits → render OmniTerm
     `statusError("No matches", details, help[])`, return exit code 2
  3. Otherwise render titleBar + tableHeader + tableRow loop with match count

### 12.2 Placeholder commands (6) — v0.1 emits informational messages

Each renders OmniTerm `statusSuccess("Coming in v0.2.0", details, help[])` and
returns exit code 0.

#### `PackageAddCommand.php`

- **Signature**: `stackra package:add <name>`
- **v0.2 goal**: Resolve `<name>` against catalog + install via composer or
  pnpm + wire ServiceProvider/AppModule registration

#### `ModuleNewCommand.php`

- **Signature**: `stackra module:new <tier/name>`
- **v0.2 goal**: Interactive blueprint scaffold (30 JSON files) + validate

#### `ModuleGenerateCommand.php`

- **Signature**: `stackra module:generate <tier/name>`
- **v0.2 goal**: Regenerate the module across backend + frontend + mobile from
  its blueprint

#### `MakeModelCommand.php`

- **Signature**: `stackra make:model <ClassName> --module=<tier/name>`
- **v0.2 goal**: 4-file quartet — Interface + Model + Migration + Factory

#### `MakePageCommand.php`

- **Signature**: `stackra make:page <resource> --domain=<name>`
- **v0.2 goal**: Refine page set — list + create + edit + show + columns +
  form + module manifest

#### `MakeNativeScreenCommand.php`

- **Signature**: `stackra make:native-screen <name> --domain=<x>`
- **v0.2 goal**: heroui-native-pro screen wired through Expo Router

---

## Verify

```sh
# Directory shape
find tools/cli -maxdepth 3 -type f | sort | head -40

# Executable bit on the binary
ls -la tools/cli/bin/stackra

# PHP lint passes for every source file
find tools/cli/src -name '*.php' -print0 | xargs -0 -n1 php -l 2>&1 | \
  grep -v "No syntax errors" | head

# Composer resolves + installs cleanly
cd tools/cli && composer install --no-interaction --no-progress 2>&1 | tail -5

# CLI runs
tools/cli/bin/stackra --version   # → Stackra CLI 0.1.0
tools/cli/bin/stackra list        # → all 10 commands appear
```

---

## Source of truth

`fullplan.md` — search for "tools/cli/", "Application.php", "Container.php", "14
concern traits", "CatalogReader", "CatalogQuery", "StubRegistry",
"TemplateManager", "NewProjectCommand", "phpstan.neon". Every specific signature
already made in fullplan.md is authoritative.
