# @stackra/kbd

Keyboard shortcut registry, command palette, catalog, hints, and customization
primitives for Stackra apps. Built on TanStack Hotkeys and HeroUI Pro Command,
wired through `@stackra/container` DI so shortcuts + commands are contributed
by any package that opts in.

## Install & register

```ts
import { KbdModule } from "@stackra/kbd";

@Module({
  imports: [
    KbdModule.forRoot({
      // Global hotkey scope; commands + shortcuts contributed by
      // downstream modules land here at bootstrap.
      persistToStorage: true,
      // Where per-user customizations live. Defaults to `localStorage`
      // via `@stackra/storage`.
    }),
  ],
})
export class AppModule {}
```

The module registers the `KbdManager`, hotkey engine, shortcut registry, and
command registry — all resolved through DI. React consumers reach the surface
through hooks under `@stackra/kbd/react`.

## Register shortcuts + commands via decorators

Contribute shortcuts and commands from any `@Injectable()` class — the
`KbdDiscoveryLoader` walks the container at `onApplicationBootstrap` and
picks them up:

```ts
import { Injectable } from "@stackra/container";
import { Shortcut, Command } from "@stackra/kbd";

@Injectable()
export class NavigationCommands {
  @Shortcut({ keys: ["mod+k"], scope: "global" })
  @Command({ id: "palette.open", label: "Open command palette" })
  public openPalette(): void {
    // …
  }
}
```

Shortcuts declared here also feed the **keyboard catalog** (a
Notion-style shortcut sheet) and the **shortcut hints overlay** — both
opt-in UI surfaces the app can mount at any level.

## React hooks

```tsx
import {
  useCommandPalette,
  useKeyboardCatalog,
  useShortcutHints,
} from "@stackra/kbd";

function AppShell() {
  const palette = useCommandPalette();
  return (
    <>
      <button type="button" onPress={() => palette.open()}>
        Open palette
      </button>
      <CommandPalette /> {/* renders HeroUI Pro Command internally */}
      <KeyboardCatalog />
      <ShortcutHints />
    </>
  );
}
```

## Customization

Per-user overrides land through `@stackra/storage` (default:
`localStorage`). A user rebinding `mod+k` to `mod+j` overrides the
package default at runtime; the change persists across reloads and syncs
across tabs if `@stackra/storage`'s BroadcastChannel driver is wired.

## Compound components

- `<CommandPalette>` — HeroUI Pro `Command` with dispatch, breadcrumbs, and
  page navigation.
- `<KeyboardCatalog>` — read-only sheet listing every registered shortcut,
  grouped by scope.
- `<ShortcutHints>` — inline hint pills next to interactive controls.

All three are HeroUI-native and follow the compound API — see the
component source under `src/components/` for exact anatomy.

## What is exempt

Logic-only helpers (`useKbdEngine`, `useCommandRegistry`) are subject to the
DI wiring but not to the HeroUI compound-component rule — they render no UI.

## See also

- `.kiro/steering/ui-components.md` — HeroUI + WCAG rules that apply to the
  UI surfaces above.
- `@stackra/container` — DI framework.
- `@stackra/state` — reactive stores used by the shortcut + command registries.
