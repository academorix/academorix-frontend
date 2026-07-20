# academorix — workspace CLI

Symfony Console app that scaffolds Academorix projects, packages, and modules.
Runs against the local workspace; never against a remote registry.

## Installation

```sh
composer install --working-dir=tools/cli
```

That's it. The binary is at `tools/cli/bin/academorix` and is executable.

## Commands

| Command              | Purpose                                                  | Status       |
| -------------------- | -------------------------------------------------------- | ------------ |
| `new`                | Bootstrap a new Academorix project                       | v0.1 shipped |
| `make:action`        | Emit a single Laravel action                             | v0.1 shipped |
| `catalog:list`       | List every catalog entry                                 | v0.1 shipped |
| `catalog:search`     | Search catalog by capability                             | v0.1 shipped |
| `package:add`        | Install a package from the workspace catalog             | v0.2 planned |
| `module:new`         | Scaffold a new module blueprint                          | v0.2 planned |
| `module:generate`    | Regenerate a module from its blueprint                   | v0.2 planned |
| `make:model`         | Emit the Interface + Model + Migration + Factory quartet | v0.2 planned |
| `make:page`          | Emit a Refine page set (list + create + edit + show)     | v0.2 planned |
| `make:native-screen` | Emit a HeroUI Native screen                              | v0.2 planned |

Run `bin/academorix list` to see every command with its live description.

## Development

```sh
# Regenerate the autoloader after changing composer.json:
composer dump-autoload --working-dir=tools/cli

# Static analysis (PHPStan level max):
tools/cli/vendor/bin/phpstan analyse

# Test:
tools/cli/vendor/bin/phpunit
```

## Design notes

- **Symfony Console 7** underneath, wrapped by our own `Application` class.
- **Illuminate Container 11** for dependency injection so commands can call
  service classes with constructor-injected dependencies.
- **Laravel Prompts 0.3** for interactive prompts (text, select, confirm,
  password, multiselect, spin).
- **pdphilip/omniterm 3** for the polished status/table/task output. See
  `.kiro/specs/utils-work/omniterm-tasks.md` (when landed) for the
  `UsesOmniTerm` wiring contract.
- **14 concern traits** compose behaviour into `AbstractCommand`. Every concrete
  command inherits every trait; nothing to opt into.
- **Global `view()` helper** in `src/helpers.php` renders any omniterm view the
  same way Laravel's global helper does.

## File layout

```
tools/cli/
├── bin/academorix              # executable entry point
├── composer.json               # dependencies + PSR-4 autoload
├── phpstan.neon                # level max
├── phpunit.xml                 # test config
├── src/
│   ├── Application.php         # Symfony Console app
│   ├── Container.php           # DI wiring
│   ├── Commands/               # 10 command classes
│   ├── Concerns/               # 14 traits composed into AbstractCommand
│   ├── Catalog/                # workspace-catalog reader + query
│   ├── Stubs/                  # stub-based file scaffolding
│   ├── Templates/              # template-directory hydration
│   ├── Blueprint/              # module-blueprint reader + validator
│   ├── Support/                # Palette, Gradient, PathResolver, ProcessRunner, Console
│   ├── Exceptions/             # CliException + 4 subclasses
│   ├── Bootstrap/              # ViewBootstrapper for the Illuminate View factory
│   └── helpers.php             # global view() helper (autoloaded)
└── tests/
    ├── Unit/
    └── Feature/
```

## Related

- `.kiro/specs/utils-work/cli-tasks.md` — the spec this CLI is built to.
- `.kiro/specs/utils-work/stubs-tasks.md` — the 69 stubs the CLI renders.
- `.kiro/agents/README.md` — the agent charters that back the CLI's design.
