/**
 * @fileoverview CollaborationModule — DI module for real-time collaboration.
 * @module @stackra/collaboration
 * @category Module
 */

import { Module, type DynamicModule } from "@stackra/container";
import { Logger } from "@stackra/logger";
import { COLLABORATION_ROOM_MANAGER } from "@stackra/contracts";

import { RoomManager } from "./services/room-manager.service";

/** Transport strategy options. */
type TransportOption = "reverb" | "broadcast" | "auto";

/**
 * DI module for the `@stackra/collaboration` package.
 *
 * Provides the {@link RoomManager} singleton configured with the
 * selected transport strategy.
 *
 * @example
 * ```typescript
 * import { CollaborationModule } from '@stackra/collaboration';
 *
 * // In your AppModule imports:
 * CollaborationModule.forRoot({ transport: 'broadcast' })
 * ```
 */
@Module({})
// biome-ignore lint/complexity/noStaticOnlyClass: Module pattern
export class CollaborationModule {
  private static readonly logger = new Logger(CollaborationModule.name);

  /**
   * Configure the collaboration module with a transport strategy.
   *
   * @param options - Module configuration options.
   * @param options.transport - Transport strategy: 'reverb', 'broadcast', or 'auto' (default).
   * @returns A dynamic module definition.
   *
   * @example
   * ```typescript
   * // Use BroadcastChannel for demos (no backend needed)
   * CollaborationModule.forRoot({ transport: 'broadcast' })
   *
   * // Use Reverb for production (requires @stackra/realtime)
   * CollaborationModule.forRoot({ transport: 'reverb' })
   *
   * // Auto-detect (tries Reverb, falls back to BroadcastChannel)
   * CollaborationModule.forRoot()
   * ```
   */
  public static forRoot(options?: { transport?: TransportOption }): DynamicModule {
    const transport = options?.transport ?? "auto";

    CollaborationModule.logger.info(`Registering with transport strategy: ${transport}`);

    return {
      module: CollaborationModule,
      global: true,
      providers: [
        {
          provide: RoomManager,
          useFactory: () => {
            const manager = new RoomManager();
            manager.configure({ transport });
            return manager;
          },
        },
        {
          provide: COLLABORATION_ROOM_MANAGER,
          useExisting: RoomManager,
        },
      ],
      exports: [RoomManager, COLLABORATION_ROOM_MANAGER],
    };
  }
}
