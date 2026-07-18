# @stackra/support

Framework-agnostic utilities used by every `@stackra/*` runtime — string
helpers, array helpers, environment resolution, fluent chains, registries,
pipeline primitives, and manager base classes.

**Why this exists.** These helpers appear in almost every domain package.
Extracting them here keeps runtime packages lean and prevents duplicate
implementations.

## Install

```bash
pnpm add @stackra/support
```

No peer dependencies.

## Modules

### String helpers — `Str`

```typescript
import { Str } from "@stackra/support";

Str.snake("helloWorld"); // 'hello_world'
Str.camel("hello_world"); // 'helloWorld'
Str.kebab("helloWorld"); // 'hello-world'
Str.studly("hello_world"); // 'HelloWorld'
Str.slug("Hello World!"); // 'hello-world'
Str.random(16); // 16-char alphanumeric
Str.plural("user"); // 'users'
Str.singular("users"); // 'user'
Str.contains("a b c", "b"); // true
Str.startsWith("abc", "ab"); // true
Str.endsWith("abc", "bc"); // true
Str.limit("very long text", 4); // 'very…'
```

### Array helpers — `Arr`

```typescript
import { Arr } from "@stackra/support";

Arr.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
Arr.pluck(users, "name");
Arr.groupBy(users, "role");
Arr.keyBy(users, "id");
Arr.uniq([1, 2, 2, 3]); // [1, 2, 3]
Arr.first(users, (u) => u.active);
Arr.last(users, (u) => u.active);
Arr.compact([1, null, 2, undefined, 3]); // [1, 2, 3]
```

### Number helpers — `Num`

```typescript
import { Num } from "@stackra/support";

Num.format(1234567); // '1,234,567'
Num.abbr(12345); // '12.3K'
Num.currency(19.99, "USD"); // '$19.99'
Num.clamp(15, 0, 10); // 10
Num.round(3.14159, 2); // 3.14
Num.percentage(0.856); // '85.6%'
```

### Environment — `Env`

Runtime detection with lazy resolution:

```typescript
import { Env } from "@stackra/support";

Env.isBrowser(); // true in DOM
Env.isNode(); // true in Node.js
Env.isTest(); // true when NODE_ENV=test
Env.isDev(); // true when NODE_ENV=development
Env.isProd(); // true when NODE_ENV=production

Env.get("API_URL"); // reads process.env / import.meta.env / window.__ENV
Env.get("PORT", 3000); // default fallback
Env.getBool("DEBUG", false);
Env.getInt("PORT", 3000);
```

### Pipeline

Composable middleware chain, generic over any input:

```typescript
import { Pipeline } from "@stackra/support";

const result = await Pipeline.of<Request>(request)
  .through([authMiddleware, rateLimitMiddleware, loggingMiddleware])
  .then(async (req) => handleRequest(req));
```

Each middleware has the signature
`(input, next) => next(transformed) | anything`. The pipeline runs top-down and
can short-circuit by not calling `next`.

### Fluent

Base class for chainable builder APIs:

```typescript
import { Fluent } from "@stackra/support";

class QueryBuilder extends Fluent {
  where(field: string, value: unknown) {
    /* ... */ return this;
  }
  orderBy(field: string) {
    /* ... */ return this;
  }
}

new QueryBuilder().where("id", 5).orderBy("name");
```

### URI parsing — `Uri`

Zero-dependency URI parser + builder:

```typescript
import { Uri } from "@stackra/support";

const uri = Uri.parse("https://api.example.com/users/5?token=abc");
uri.host; // 'api.example.com'
uri.path; // '/users/5'
uri.query; // { token: 'abc' }

Uri.build({ host: "example.com", path: "/x", query: { a: "1" } });
// 'https://example.com/x?a=1'
```

### BaseRegistry

Generic register/resolve/list surface for anything named:

```typescript
import { BaseRegistry } from "@stackra/support";

class ReporterRegistry extends BaseRegistry<Reporter> {}

const registry = new ReporterRegistry();
registry.register("console", new ConsoleReporter());
registry.get("console"); // Reporter
registry.has("console"); // true
registry.names(); // ['console']
registry.list(); // Reporter[]
```

### Manager

Base class for driver-based subsystems (Laravel-style Manager pattern). Every
`@stackra/*` manager (`CacheManager`, `LoggerManager`, `QueueManager`,
`RealtimeManager`) extends this:

```typescript
import { Manager } from "@stackra/support";

class MyManager extends Manager<MyDriver> {
  protected createFooDriver(config: unknown): MyDriver {
    /* ... */
  }
  protected createBarDriver(config: unknown): MyDriver {
    /* ... */
  }

  public getDefaultDriver(): string {
    return "foo";
  }
}

const mgr = new MyManager();
mgr.driver(); // default driver instance
mgr.driver("bar"); // named driver
mgr.extend("custom", () => new CustomDriver()); // register externally
```

## License

MIT
