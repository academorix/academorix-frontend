/**
 * @file mock-before-install-prompt-event.ts
 * @module @stackra/pwa/testing
 * @description In-memory `BeforeInstallPromptEvent` stand-in for tests.
 *
 *   Chromium's `BeforeInstallPromptEvent` is only available in real
 *   browsers. Tests exercise the install flow by dispatching this
 *   mock through a jsdom `window`.
 */

import type { IBeforeInstallPromptEvent } from '@/core/services';

/**
 * Test double implementing the {@link IBeforeInstallPromptEvent}
 * shape.
 *
 * The class extends the standard `Event` so `dispatchEvent(mock)`
 * runs the same event-loop path as the real thing.
 *
 * @example
 * ```ts
 * const event = new MockBeforeInstallPromptEvent();
 * window.dispatchEvent(event);
 * event.simulateUserChoice('accepted');
 * ```
 */
export class MockBeforeInstallPromptEvent extends Event implements IBeforeInstallPromptEvent {
  /** Resolves when `simulateUserChoice` is called. */
  public readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;

  /** Number of times `prompt()` has been called. */
  public promptCalls = 0;

  /** Number of times `preventDefault()` has been called. */
  public preventDefaultCalls = 0;

  private resolveChoice!: (result: { readonly outcome: 'accepted' | 'dismissed' }) => void;

  public constructor() {
    super('beforeinstallprompt');
    // The real event's `userChoice` is a promise the caller awaits
    // after `prompt()`. Match that shape by holding the resolver.
    this.userChoice = new Promise((resolve) => {
      this.resolveChoice = resolve;
    });
  }

  /** Standard event override — counts invocations for tests. */
  public preventDefault(): void {
    super.preventDefault();
    this.preventDefaultCalls += 1;
  }

  /** Standard prompt — counts invocations for tests. */
  public async prompt(): Promise<void> {
    this.promptCalls += 1;
    return Promise.resolve();
  }

  /**
   * Resolve `userChoice` with the caller-supplied outcome. Tests
   * call this after `prompt()` to simulate the user picking a
   * choice.
   */
  public simulateUserChoice(outcome: 'accepted' | 'dismissed'): void {
    this.resolveChoice({ outcome });
  }
}
