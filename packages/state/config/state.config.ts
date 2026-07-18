/**
 * @file state.config.ts
 * @module @stackra/state/config
 * @description Application-level reactive-state feature configuration.
 *   `StateModule.forRoot()` takes no args; this template hosts a
 *   sample store to register via `StateModule.forFeature(...)`.
 */

/**
 * Sample preferences store. Rename + reshape for your app; register
 * with `StateModule.forFeature(preferencesStore)` in your AppModule.
 */
export const PREFERENCES_STORE = Symbol.for('PREFERENCES_STORE');

export interface PreferencesState {
  readonly greeting: string;
  readonly compact: boolean;
}

export const preferencesStore = {
  /*
  |--------------------------------------------------------------------------
  | Name
  |--------------------------------------------------------------------------
  |
  | Human-readable identifier displayed in devtools and used as the
  | routing key for cross-tab / realtime broadcasts. Keep it short.
  |
  */
  name: 'preferences',

  /*
  |--------------------------------------------------------------------------
  | Token
  |--------------------------------------------------------------------------
  |
  | DI token every consumer that reads / writes this store injects.
  | `Symbol.for(...)` gives a cross-realm identity so SSR + client
  | resolve to the same store.
  |
  */
  token: PREFERENCES_STORE,

  /*
  |--------------------------------------------------------------------------
  | Initial State
  |--------------------------------------------------------------------------
  |
  | The store's default shape. Persisted values (below) hydrate on
  | top at boot.
  |
  */
  initialState: {
    greeting: 'Hello Stackra',
    compact: false,
  } satisfies PreferencesState,

  /*
  |--------------------------------------------------------------------------
  | Cross-Tab Broadcast
  |--------------------------------------------------------------------------
  |
  | Fan mutations out to other tabs via
  | `@stackra/coordinator`'s BroadcastChannel adapter.
  |
  */
  crossTab: true,

  /*
  |--------------------------------------------------------------------------
  | Realtime Broadcast
  |--------------------------------------------------------------------------
  |
  | Push mutations through `@stackra/realtime` to other clients on
  | the same channel. Requires a realtime driver.
  |
  */
  realtime: false,

  /*
  |--------------------------------------------------------------------------
  | Persistence
  |--------------------------------------------------------------------------
  |
  | Which `@stackra/storage` instance persists this store's state.
  | `'localStorage'` survives reloads; `false` disables persistence.
  |
  */
  persistence: 'localStorage' as const,
};
