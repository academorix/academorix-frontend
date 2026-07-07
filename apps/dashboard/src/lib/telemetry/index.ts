/**
 * @file index.ts
 * @module lib/telemetry
 *
 * @description
 * Public barrel for the dashboard telemetry surface. Consumers import from
 * `@/lib/telemetry` and get everything they need — the reporter entrypoint
 * plus the shared type aliases.
 *
 * The barrel exists so that:
 *
 *   1. `main.tsx` has a single import path (`import { reportWebVitals } from "@/lib/telemetry"`).
 *   2. Consumers that want the types (e.g. an analytics adapter that types
 *      its `web_vital` event payload) don't have to reach into the type
 *      file's specific path.
 *   3. Future telemetry helpers (page-view reporting, custom RUM beacons,
 *      long-task observers) land here and stay re-exported through the same
 *      surface.
 *
 * Kept flat on purpose — telemetry helpers are utilities, not React
 * primitives, so there's no provider/component tree to compose here.
 *
 * @related web-vitals.util.ts — the observer registration entrypoint.
 * @related web-vitals.type.ts — the shared type aliases.
 * @related README.md          — narrative doc for humans.
 */

export { reportWebVitals } from "./web-vitals.util";
export type {
  ReportWebVitalsFn,
  WebVitalName,
  WebVitalNavType,
  WebVitalRating,
  WebVitalReport,
} from "./web-vitals.type";
