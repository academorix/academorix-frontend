// Lighthouse CI configuration skeleton.
//
// Copy to: <app-root>/lighthouserc.js
// Owning agent: performance-engineer
//
// Reference: https://github.com/GoogleChrome/lighthouse-ci

module.exports = {
  ci: {
    collect: {
      // TODO(performance-engineer): point at the app's real URLs.
      // For a Vite app under `pnpm preview`:
      //   startServerCommand: 'pnpm preview --port 4173',
      //   url: ['http://localhost:4173/'],
      // For a Laravel app under `php artisan serve`:
      //   startServerCommand: 'php artisan serve --port=8000',
      //   url: ['http://localhost:8000/', 'http://localhost:8000/dashboard'],
      startServerCommand: '',
      url: [],
      numberOfRuns: 3,
    },
    assert: {
      // Baseline budgets — tighten per app once real numbers are known.
      assertions: {
        // Core Web Vitals — the two that fail loudest first.
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Category scores.
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Bundle size — align with .size-limit.json.
        // TODO(performance-engineer): set unused-javascript budget in bytes
        // that matches the app's actual initial-chunk size.
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // TODO(performance-engineer): switch to LHCI server or GitHub artefacts
      // once the pipeline is real.
    },
  },
};
