/**
 * @file sdui-page.registry.ts
 * @module @stackra/sdui/core/registries
 * @description SduiPageRegistry — in-memory catalog of resolved pages
 *   keyed by URL path.
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type { ISduiPageDescriptor } from "@stackra/contracts";

/**
 * SduiPageRegistry — `BaseRegistry<string, ISduiPageDescriptor>` keyed
 * by URL path.
 */
@Injectable()
export class SduiPageRegistry extends BaseRegistry<string, ISduiPageDescriptor> {
  public override register(path: string, entry: ISduiPageDescriptor): this {
    return this.replace(path, entry);
  }

  public resolve(path: string): ISduiPageDescriptor | undefined {
    return this.get(path);
  }

  public list(): readonly ISduiPageDescriptor[] {
    return this.values();
  }
}
