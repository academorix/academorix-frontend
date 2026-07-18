# @stackra/sdui

Server-Driven UI runtime for the Stackra framework — sandboxed expression
evaluator, per-node error boundary, screen validator, action adapter,
and HeroUI-powered renderer.

## What's shipping today

- Full SDUI wire contract in `@stackra/contracts`: `ISduiScreen`,
  `ISduiNode`, `ISduiExpression`, `ISduiAction`, `ISduiThemeDocument`,
  `ISduiDataSource`, `ISduiEvalScope` + `SduiActionKind`, `SduiViewKind`,
  `SDUI_EVENTS`.
- Sandboxed expression evaluator (`evaluateExpression`, `resolveBindable`,
  `evaluateBoolean`, `isExpression`) — path form + allow-listed operator
  form. Never uses `eval` or `Function`.
- Screen validator — walks any `ISduiScreen` and reports every issue.
- `<NodeErrorBoundary>` — per-node error boundary that catches render
  failures and shows a themed fallback.
- `<SduiRuntimeProvider>` — owns local state, overlays, form registry,
  notify sink.
- Action adapter — translates schema-level `ISduiAction` variants into
  `@stackra/actions` `IActionDescriptor` payloads before dispatch.

## What's coming (deferred)

- TypeScript-Compiler-API manifest extractor that enumerates every
  `@heroui/react` + `@heroui-pro/react` export and emits a JSON manifest.
- Component registry generated from the manifest.
- Hand-composed leaves for boundary-hostile compounds (charts, collections,
  form controls, overlays).
- `SduiService` (schema fetch + cache), `PagesService`, `PageResolverService`,
  `RouteSyncService`.
- Recursive `<SduiTree>` / `<SduiNodeView>` renderer.
- Native subpath.
- Full property-based test suite (P1-P9 from the spec).

Track progress in `.kiro/specs/sdui/tasks.md`.

## License

MIT © Stackra L.L.C
