/**
 * `@stackra/http/react` — React entry point.
 *
 * Optional React surface for the HTTP package. Hooks compose
 * `useInject` from `@stackra/container/react` so they work in
 * web AND React Native consumers.
 *
 * Web/native consumers must also import the root `@stackra/http`
 * to register the module.
 *
 * @module @stackra/http/react
 */

export { useHttp, useHttpManager, useHttpConnection, useStream, useSse } from "./hooks";
export type { IUseHttpResult, IUseStreamResult, IUseSseResult } from "./hooks";
