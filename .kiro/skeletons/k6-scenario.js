// k6 load-test scenario skeleton.
//
// Copy to: <app-root>/perf/k6/<scenario>.js
// Owning agent: performance-engineer
//
// Run locally:   k6 run --vus 10 --duration 30s <scenario>.js
// Run in CI:     k6 run --out cloud <scenario>.js  (needs K6_CLOUD_TOKEN)
//
// Reference: https://k6.io/docs/

import http from 'k6/http';
import { check, sleep } from 'k6';

// ────────────────────────────────────────────────────────────────
// Options — stages, thresholds, tags.
// ────────────────────────────────────────────────────────────────

export const options = {
  // Ramp shape — replace with the pattern that matches production traffic.
  stages: [
    { duration: '30s', target: 10 },   // Warm-up: 0 → 10 VUs over 30s
    { duration: '2m',  target: 10 },   // Steady state
    { duration: '30s', target: 50 },   // Spike: 10 → 50 VUs
    { duration: '2m',  target: 50 },   // Steady-under-spike
    { duration: '30s', target: 0 },    // Ramp down
  ],

  // Thresholds — the whole run FAILS if any of these are breached.
  thresholds: {
    // 95th percentile p95 latency must stay under 500ms.
    http_req_duration: ['p(95)<500'],
    // Failure rate must stay under 1%.
    http_req_failed: ['rate<0.01'],
    // TODO(performance-engineer): add per-endpoint thresholds via tags:
    //   'http_req_duration{endpoint:login}': ['p(95)<300'],
  },

  // Cloud output tags — surface per-run in the k6 dashboard.
  tags: {
    // TODO(performance-engineer): set app + environment.
    app: 'placeholder',
    environment: 'staging',
  },
};

// ────────────────────────────────────────────────────────────────
// Setup — runs ONCE before the test starts. Use for auth / warm-up.
// ────────────────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4173';

export function setup() {
  // TODO(performance-engineer): if the endpoints require auth, do a real
  // login here and return the bearer token to the default() function.
  //   const res = http.post(`${BASE_URL}/api/auth/login`, { ... });
  //   return { token: res.json('token') };
  return { token: null };
}

// ────────────────────────────────────────────────────────────────
// Default function — every VU runs this in a loop.
// ────────────────────────────────────────────────────────────────

export default function (data) {
  const headers = data.token
    ? { Authorization: `Bearer ${data.token}` }
    : {};

  // Example endpoint — replace with the app's real workload.
  const res = http.get(`${BASE_URL}/api/health`, {
    headers,
    tags: { endpoint: 'health' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // TODO(performance-engineer): add the workload's realistic think-time.
  sleep(1);
}

// ────────────────────────────────────────────────────────────────
// Teardown — runs ONCE after the test finishes. Use for cleanup.
// ────────────────────────────────────────────────────────────────

export function teardown(_data) {
  // TODO(performance-engineer): call cleanup endpoints if the test seeded any
  // state (test users, tenants, ...).
}
