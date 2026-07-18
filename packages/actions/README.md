# @stackra/actions

Framework Action layer — a single dispatcher, a name-keyed registry of handlers,
and a Laravel-style middleware pipeline (`Authorize → Log → Trace → handler`)
for every side effect in the app. Every button click, SDUI schema event, and AI
tool call flows through the same seam, so authorization, logging, tracing, and
cancellation land in one place.

## Install

```bash
pnpm add @stackra/actions @stackra/container @stackra/contracts \
        @stackra/support @stackra/pipeline @stackra/logger @stackra/events
```

## Quick start

```ts
import { Module, ApplicationFactory } from '@stackra/container';
import { PipelineModule } from '@stackra/pipeline';
import { EventsModule } from '@stackra/events';
import { LoggerModule } from '@stackra/logger';
import { ActionsModule } from '@stackra/actions';
import { ActionKind, ACTION_DISPATCHER, type IActionDispatcher } from '@stackra/contracts';

@Module({
  imports: [
    LoggerModule.forRoot(),
    EventsModule.forRoot(),
    PipelineModule.forRoot(),
    ActionsModule.forRoot({
      permissionResolver: (perm, ctx) => user.hasPermission(perm),
    }),
  ],
})
class AppModule {}

const app = await ApplicationFactory.create(AppModule);
const dispatch = app.get<IActionDispatcher>(ACTION_DISPATCHER);

await dispatch.dispatch({
  kind: ActionKind.Composite,
  actions: [
    { kind: ActionKind.Mutate, endpoint: '/api/orders/1/approve', method: 'POST' },
    { kind: ActionKind.Toast, status: 'success', message: 'Order approved' },
    { kind: ActionKind.Refresh, resource: 'orders' },
  ],
});
```

Every well-known descriptor variant lives in `@stackra/contracts`:
`INavigateAction`, `IToastAction`, `IMutateAction`, `IComposite`,
`IAiToolAction`, ...

## What ships in this package

- `ActionRegistry` — `BaseRegistry<string, IActionHandler>`
- `ActionDispatcherService` — resolves the handler for a descriptor, runs it
  through the pipeline, emits `ACTION_EVENTS.STARTED/SUCCEEDED/FAILED`
- Middleware: `AuthorizeMiddleware`, `LogMiddleware`, `TraceMiddleware`
- Built-in handlers: `CompositeHandler`, `DispatchHandler` (both depend only on
  the dispatcher itself; every other well-known handler ships in its owner
  package under `<pkg>/actions`)
- `@ActionHandler(kind)` decorator + `HandlerLoader`
- React bindings (web AND native): `useActionDispatcher`, `useAction`,
  `useActionPress`, `useActionChange`, `useActionSelection`, `<Action>` slot,
  `<ActionButton>` (deprecated — see below).

## Binding pressables

The React bindings ship two primitives and NO per-component wrappers. Consumers
wire any HeroUI OSS/Pro/Native/Native-Pro pressable (Button, MenuItem, Link,
PressableFeedback, ProgressButton, SlideButton, Switch, Slider, NumberField,
DatePicker, Tabs, Menu, …) through the same hooks and slot.

### `<Action>` slot — polymorphic press-slot

```tsx
import { Button, MenuItem, Link } from '@stackra/ui/react';
import { Action } from '@stackra/actions/react';

<Action action={{ kind: 'navigate', to: '/orders' }}>
  <Button>Open orders</Button>
</Action>

<Action action={{ kind: 'toast', message: 'Copied' }}>
  <MenuItem>Copy link</MenuItem>
</Action>

<Action action={{ kind: 'openOverlay', overlayId: 'help' }}>
  <Link>Help</Link>
</Action>
```

The slot clones its single child, wires `onPress` to dispatch the descriptor,
and forwards `isPending`. Composes with HeroUI's own `asChild` on both web and
native.

### `useActionPress` — pressable with local state

```tsx
const save = useActionPress({ kind: 'mutate', endpoint: '/api/save', method: 'POST' });
<Button onPress={save.onPress} isPending={save.isPending}>Save</Button>

// Imperative override:
<Button onPress={() => save.run({ kind: 'mutate', endpoint: `/api/save/${id}` })}>
  Save
</Button>
```

Returns `{ onPress, run, reset, isPending, error, data }`.

### `useActionChange` — value-change binding

For Switch / Checkbox / Slider / NumberField / DateField / ColorSwatchPicker /
any component whose event carries a single value:

```tsx
const onSelectionChange = useActionChange<boolean>((v) => ({
  kind: 'setState',
  path: 'settings.autoLock',
  value: v,
}));

<Switch onSelectionChange={onSelectionChange}>
  <Switch.Content>
    Auto-lock
    <Switch.Control>
      <Switch.Thumb />
    </Switch.Control>
  </Switch.Content>
</Switch>;
```

Return `null` from the mapper to skip a dispatch (useful for filtering
identical-value re-emissions).

### `useActionSelection` — selection-change binding

For Tabs / Menu / ListBox / ComboBox / Segment / RadioGroup:

```tsx
const onSelectionChange = useActionSelection<Key>((k) => ({
  kind: 'navigate',
  to: `/section/${String(k)}`,
}));

<Tabs onSelectionChange={onSelectionChange}>…</Tabs>;
```

For `selectionMode='multiple'`, type as `Set<Key>` and pick the key(s) you care
about in the mapper.

### Event-shape cheatsheet

| HeroUI surface                                                                                                                             | Event                                   | Hook / slot                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------- |
| Button, PressableFeedback, ProgressButton, SlideButton, SocialAuthButton                                                                   | `onPress`                               | `useActionPress` or `<Action>`           |
| Link, MenuItem, ListBox.Item, Command.Item, Sheet.Trigger, DatePicker.Trigger, Stepper.Step, TableRow, EmojiReactionButton, Rating (press) | `onPress` / `onAction`                  | `useActionPress` or `<Action>`           |
| Switch, Checkbox, Toggle                                                                                                                   | `onSelectionChange` / `onChange` (bool) | `useActionChange<boolean>`               |
| Slider, NumberField, NumberStepper                                                                                                         | `onChange` (number)                     | `useActionChange<number>`                |
| DateField, DatePicker                                                                                                                      | `onChange` (DateValue)                  | `useActionChange<DateValue>`             |
| Tabs, Segment                                                                                                                              | `onSelectionChange` (Key)               | `useActionSelection<Key>`                |
| ListBox, ComboBox, Menu (selectionMode)                                                                                                    | `onSelectionChange` (`Set<Key>`)        | `useActionSelection<Set<Key>>`           |
| RadioGroup, CheckboxGroup                                                                                                                  | `onChange`                              | `useActionChange` / `useActionSelection` |
| ColorSwatchPicker                                                                                                                          | `onChange` (Color)                      | `useActionChange<Color>`                 |

### `<ActionButton>` — deprecated

Retained for backwards compatibility. Prefer `<Action>` composed over any HeroUI
Button (or any pressable) — it does the same thing and works across the whole
HeroUI surface, not just Button.

## Subpaths

| Import                     | Purpose                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| `@stackra/actions`         | `ActionsModule`, dispatcher, registry, middleware, handlers            |
| `@stackra/actions/react`   | Hooks + `<Action>` slot + deprecated `<ActionButton>` (web)            |
| `@stackra/actions/native`  | Hooks + `<Action>` slot (React Native — same API, no `<ActionButton>`) |
| `@stackra/actions/testing` | `createMockDispatcher`, `createMockRegistry`, assertions               |

## Contracts

Every token, interface, enum, and event map lives in `@stackra/contracts`. This
package imports them directly and re-exports none.

## License

MIT © Stackra L.L.C
