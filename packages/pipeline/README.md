# @stackra/pipeline

Laravel-style middleware pipeline with a fluent API, DI-container integration,
and named preset registration via `PipelineHub`. Framework-agnostic, zero server
dependency, works in every JavaScript runtime.

## Install

```bash
pnpm add @stackra/pipeline @stackra/container @stackra/contracts reflect-metadata
```

Peer requirements: `@stackra/container`, `@stackra/contracts`,
`reflect-metadata`.

## Quick start

```typescript
import "reflect-metadata";
import { ApplicationFactory, Module } from "@stackra/container";
import { PipelineModule, Pipeline } from "@stackra/pipeline";

@Module({
  imports: [PipelineModule.forRoot()],
})
class AppModule {}

const app = await ApplicationFactory.create(AppModule);

const result = new Pipeline<number>(app)
  .send(1)
  .through([(n, next) => next(n + 1), (n, next) => next(n * 10)])
  .thenReturn();

console.log(result); // 20
```

## Public API

### `Pipeline<TPassable, TReturn>`

The fluent pipeline class. Composes a chain of pipes that transform a passable
value.

```typescript
new Pipeline(container)
  .send(input) // set the passable
  .through(pipes) // replace all pipes
  .pipe(extra) // append additional pipes
  .via("process") // override handler method name (default: 'handle')
  .finally((v) => log(v)) // callback after execution
  .then((v) => destination) // execute with destination
  // — or —
  .thenReturn(); // execute and return the passable as-is
```

### `PipelineHub`

Named pipeline preset registry — reusable pipeline configurations invoked by
name.

```typescript
import { PipelineHub } from "@stackra/pipeline";

@Injectable()
class OrderService {
  constructor(private hub: PipelineHub) {}

  onModuleInit() {
    this.hub.defaults((pipeline, passable) =>
      pipeline.send(passable).through([Sanitize]).thenReturn(),
    );

    this.hub.pipeline("order-validation", (pipeline, order) =>
      pipeline
        .send(order)
        .through([ValidateStock, ValidatePayment, ValidateAddress])
        .thenReturn(),
    );
  }

  validate(order: Order) {
    return this.hub.pipe(order, "order-validation");
  }
}
```

Hub runtime API:

```typescript
hub.defaults(cb);          // set the default pipeline definition
hub.pipeline(name, cb);    // register a named pipeline
hub.pipe(passable, name?); // execute a named or default pipeline
hub.has(name);             // boolean — does this name exist?
```

### `PipelineModule`

DI module exposing `Pipeline`, `PipelineHub`, and `PIPELINE_FACTORY`. Import
once at the root:

```typescript
@Module({
  imports: [PipelineModule.forRoot()],
})
class AppModule {}
```

### `PIPELINE_FACTORY`

DI token for a factory that produces fresh `Pipeline` instances backed by the
container.

```typescript
import { Inject, Injectable } from "@stackra/container";
import { PIPELINE_FACTORY, PipelineFactory } from "@stackra/pipeline";

@Injectable()
class RequestHandler {
  constructor(
    @Inject(PIPELINE_FACTORY) private makePipeline: PipelineFactory,
  ) {}

  handle(request: Request) {
    return this.makePipeline<Request, Response>()
      .send(request)
      .through([Auth, Logging, Handler])
      .thenReturn();
  }
}
```

### `PipelineError`

Thrown when a pipe cannot be resolved or executed. Carries a `code` for
programmatic dispatch:

| Code                     | Meaning                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `INVALID_PIPE_TYPE`      | Pipe was not a function, string, object, or tuple            |
| `INVALID_PIPE_ENTRY`     | Tuple's first element was of an unsupported type             |
| `NO_CONTAINER`           | String pipe used but no container provided to Pipeline       |
| `PIPE_RESOLUTION_FAILED` | Container threw while resolving a string pipe                |
| `INVALID_RESOLVED_PIPE`  | Container returned a non-object for a string pipe            |
| `METHOD_NOT_FOUND`       | Pipe object is missing the configured handler method         |
| `PIPE_EXECUTION_FAILED`  | A pipe threw during execution (`cause` carries the original) |
| `INVALID_PIPELINE_NAME`  | Empty name passed to `hub.pipeline(name, cb)`                |
| `PIPELINE_NOT_FOUND`     | `hub.pipe(v, name)` called with an unregistered name         |
| `NO_DEFAULT_PIPELINE`    | `hub.pipe(v)` called with no name and no default registered  |

## Pipe forms

A pipe can be any of four shapes:

### Closure

Simplest form — a function taking `(passable, next)`:

```typescript
const AddOne = (n: number, next: (n: number) => number) => next(n + 1);

new Pipeline<number>().send(1).through([AddOne]).thenReturn(); // 2
```

### String (DI-resolved)

Resolved from the container by name/token. The resolved instance must have a
handler method (default `handle`):

```typescript
@Injectable()
class LoggingPipe {
  handle(request: Request, next: (r: Request) => Response) {
    console.log(request.url);
    return next(request);
  }
}

// register `LoggingPipe` under the string 'logging' via a module provider
// ...
new Pipeline<Request, Response>(container)
  .send(request)
  .through(["logging"])
  .then((r) => processRequest(r));
```

### Object

Instance with a handler method — bypasses container resolution:

```typescript
new Pipeline<Request, Response>()
  .send(request)
  .through([new LoggingPipe()])
  .then((r) => processRequest(r));
```

### Tuple (parameterized)

`[pipe, ...params]` — extra params flow to the handler after `(passable, next)`:

```typescript
@Injectable()
class RateLimitPipe {
  handle(
    req: Request,
    next: (r: Request) => Response,
    limit: number,
    window: string,
  ) {
    // ...
    return next(req);
  }
}

new Pipeline<Request, Response>(container)
  .send(request)
  .through([["rate-limit", 100, "1m"]])
  .then((r) => processRequest(r));
```

## Container integration

Every string pipe is resolved through the `@stackra/container` DI system. The
`Pipeline` constructor takes an optional `IApplication`:

- **With container** — string pipes work, `Pipeline` is itself `@Injectable()`
  so it can be injected anywhere.
- **Without container** — only function and object pipes are supported (string
  pipes throw `NO_CONTAINER`).

When injecting `Pipeline` into your services, always inject a **factory**
(`PIPELINE_FACTORY`) rather than a singleton — pipelines are single-use, and
reusing the same instance across requests will leak state.

## `via()` — custom method names

By default the pipeline calls `handle(passable, next)` on pipe objects. Use
`.via(method)` to invoke a different method:

```typescript
class ProcessorPipe {
  process(data: Data, next: (d: Data) => Data) {
    return next(transform(data));
  }
}

new Pipeline<Data>()
  .send(data)
  .via("process")
  .through([new ProcessorPipe()])
  .thenReturn();
```

## `finally()` — post-execution callback

The `finally` callback fires after `then()` / `thenReturn()` completes,
receiving the (potentially mutated) passable:

```typescript
new Pipeline<Request, Response>()
  .send(request)
  .through([Auth, Logging])
  .finally((req) => telemetry.record(req))
  .then((r) => handleRequest(r));
```

## `PipelineHub` presets

Use the Hub when the same pipeline definition is called from multiple sites.
Register once, invoke by name — the passable is provided at call time.

```typescript
@Injectable()
class BootstrapService {
  constructor(private hub: PipelineHub) {}

  onModuleInit() {
    // Preset A — inbound HTTP
    this.hub.pipeline("http-inbound", (pipeline, req) =>
      pipeline.send(req).through([Auth, RateLimit, Logger]).thenReturn(),
    );

    // Preset B — outbound API call
    this.hub.pipeline("http-outbound", (pipeline, req) =>
      pipeline
        .send(req)
        .through([AddAuthHeader, Retry, Telemetry])
        .thenReturn(),
    );
  }
}

// elsewhere
const finalReq = hub.pipe(request, "http-inbound");
```

## Types

```typescript
type PipeClosure<TPassable, TResult> = (
  passable: TPassable,
  next: (passable: TPassable) => TResult,
) => TResult;

type PipeTuple = [PipeEntry, ...unknown[]];

type PipeEntry = string | object | PipeClosure<unknown, unknown>;

type PipeType = PipeClosure<unknown, unknown> | string | object | PipeTuple;

type PipelineDefinition = <T>(pipeline: Pipeline, passable: T) => unknown;

type PipelineFactory = <TPassable = unknown, TReturn = TPassable>() => Pipeline<
  TPassable,
  TReturn
>;
```

## Error handling

Every pipe execution is wrapped in a try/catch. If a pipe throws:

- **Non-`PipelineError`** — wrapped in a new `PipelineError` with code
  `PIPE_EXECUTION_FAILED` and the original attached as `cause`.
- **Already a `PipelineError`** — re-thrown unchanged.

This preserves the original stack trace via the `cause` chain while giving
downstream code a stable error surface.

```typescript
import { PipelineError } from "@stackra/pipeline";

try {
  const result = pipeline.thenReturn();
} catch (err) {
  if (err instanceof PipelineError) {
    console.error(err.code, err.message, err.cause);
  }
}
```

## Integration with `@stackra/ssr/middleware`

`@stackra/pipeline` is the runtime that powers HTTP and UI middleware in
`@stackra/ssr`. Any `MiddlewareDefinition` can be adapted to a `PipeType` via
`toPipe(mw, container)` and dropped straight into `.through([...])`.

See the [SSR middleware docs](../ssr/README.md#middleware) for the full
integration story.

## Testing helper — `@stackra/pipeline/testing`

Two helpers for exercising pipes in isolation:

```typescript
import { runPipe, createMockPipeline } from "@stackra/pipeline/testing";

// Run a single pipe end-to-end — great for unit-testing middleware
const result = runPipe<Request>(
  (req, next) => next({ ...req, userId: "ada" }),
  new Request("http://x/"),
  (req) => new Response(JSON.stringify(req)),
);

// Object-form pipe
class AuthPipe {
  handle(req: Request, next: (req: Request) => unknown) {
    if (!req.headers.get("authorization")) throw new Error("unauth");
    return next(req);
  }
}
const authed = runPipe(new AuthPipe(), authRequest, (r) => r);

// Assertable Pipeline — real Pipeline instance wrapped for call recording
const pipeline = createMockPipeline<Request, Response>();
pipeline
  .send(req)
  .through([AuthPipe])
  .then((r) => handle(r));
pipeline.$.assertCalled("through").once();
```

`runPipe` supports function, object, and tuple pipe forms. String pipes require
a container — use `createMockPipeline(container)` (or a real `Pipeline`) for
those.

## Subpaths

| Import                      | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `@stackra/pipeline`         | `PipelineModule`, `Pipeline`, `PipelineHub` |
| `@stackra/pipeline/testing` | `runPipe()`, `createMockPipeline()`         |

## License

MIT © Stackra L.L.C
