/**
 * @file layout.registry.ts
 * @module @stackra/sdui/core/registries
 * @description LayoutRegistry — scene-template registry consumed by
 *   `<SduiScreenView>` when `ISduiScreen.layout` is set.
 */

import { Injectable } from '@stackra/container';
import { BaseRegistry } from '@stackra/support';
import type { ISduiLayoutEntry } from '@stackra/contracts';

/**
 * LayoutRegistry — `BaseRegistry<string, ISduiLayoutEntry>`.
 */
@Injectable()
export class LayoutRegistry extends BaseRegistry<string, ISduiLayoutEntry> {
  public override register(key: string, entry: ISduiLayoutEntry): this {
    return this.replace(key, entry);
  }

  public resolve(key: string): ISduiLayoutEntry | undefined {
    return this.get(key);
  }

  public getKeys(): readonly string[] {
    return this.keys();
  }
}
