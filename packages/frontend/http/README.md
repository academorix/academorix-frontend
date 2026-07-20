# @stackra/http

Multi-driver HTTP client for the Stackra framework — axios/fetch connectors, middleware + interceptor pipelines, streaming (SSE/NDJSON/JSON/text/binary), circuit breaker, rate limiting, metrics, uploads, and React hooks.

## Quick start

```typescript
import { Module } from '@stackra/container';
import { HttpModule } from '@stackra/http';

@Module({
  imports: [
    HttpModule.forRoot({
      default: 'api',
      connections: {
        api: { baseURL: 'https://api.example.com', timeout: 10_000 },
        auth: { baseURL: 'https://auth.example.com', timeout: 5_000 },
      },
    }),
  ],
})
export class AppModule {}
```

```typescript
import { Injectable, Inject } from '@stackra/container';
import { HTTP_CLIENT, type IHttpClient } from '@stackra/contracts';

@Injectable()
class UserService {
  public constructor(@Inject(HTTP_CLIENT) private readonly api: IHttpClient) {}

  public async getUsers() {
    const res = await this.api.get<IUser[]>('/users');
    return res.data;
  }
}
```

## Feature modules — `forFeature`

A single `forFeature(options)` entry registers custom drivers and/or extra
connections and/or per-connection middleware / interceptors. Post-wire
registration runs through a lifecycle-hook seeder (`OnApplicationBootstrap`)
resolved via `ModuleRef` — no bootstrap marker tokens.

```typescript
import { FetchConnector } from '@stackra/http/fetch';

@Module({
  imports: [
    // Register a custom driver:
    HttpModule.forFeature({ driver: 'fetch', connector: FetchConnector }),

    // Add a connection + scoped middleware/interceptors:
    HttpModule.forFeature({
      connections: {
        billing: { baseURL: 'https://billing.example.com', timeout: 15_000 },
      },
      middleware: [{ use: AuditMiddleware, connection: 'billing' }],
      interceptors: [{ use: TraceInterceptor, connection: ['api', 'billing'] }],
    }),
  ],
})
export class BillingModule {}
```

## Streaming

```typescript
// Server-Sent Events
for await (const event of client.sse<Ticker>('/prices/stream')) {
  store.update(event.data);
}

// RxJS adapter (optional)
import { fromHttpStream } from '@stackra/http/rxjs';
const prices$ = fromHttpStream(client.sse<Ticker>('/prices/stream'));
```

## React bindings — `@stackra/http/react`

```tsx
import { useHttp, useStream, useSse } from '@stackra/http/react';

function Prices() {
  const { values, open } = useStream<Ticker>('/prices/stream');
  return <PriceList prices={values} live={open} />;
}
```

## Testing helper — `@stackra/http/testing`

```typescript
import { createMockHttp } from '@stackra/http/testing';

const http = createMockHttp();
const api = http.client();
api.stubResponse('GET', '/users/42', { data: { id: 42, name: 'Ada' } });

await userService.load(42); // internally: api.get('/users/42')

api.$.assertCalled('get').with('/users/42').once();
expect(api.requestsFor('GET')).toHaveLength(1);
```

Both `MockHttpManager` and `MockHttpClient` implement the full `IHttpManager` /
`IHttpClient` contracts, record every request, and support response + stream
stubbing.

## Configuration

```bash
cp node_modules/@stackra/http/config/http.config.ts src/config/http.config.ts
```

## Subpaths

| Import                  | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `@stackra/http`         | `HttpModule`, `HttpManager`, `AxiosConnector`, middleware, interceptors |
| `@stackra/http/fetch`   | `FetchConnector` (fetch driver for browsers/edge/RN)                    |
| `@stackra/http/rxjs`    | `fromHttpStream()` — `IHttpStream` → RxJS `Observable`                  |
| `@stackra/http/react`   | `useHttp`, `useHttpManager`, `useHttpConnection`, `useStream`, `useSse` |
| `@stackra/http/testing` | `createMockHttp()`, `createMockHttpClient()`                            |

## License

MIT © Stackra L.L.C
