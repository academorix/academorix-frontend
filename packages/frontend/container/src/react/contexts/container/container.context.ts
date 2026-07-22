/**
 * @file container.context.ts
 * @module @stackra/container/react/contexts/container
 * @description React context that holds the application context.
 *
 *   `null` by default — must be provided by `ContainerProvider`.
 *   Using `useInject()` outside of a `ContainerProvider` will throw.
 */

import { createContext } from "react";
import type { ApplicationContext } from "@/core/application/application-context.service";

/**
 * React context that holds the application context.
 *
 * `null` by default — must be provided by `ContainerProvider`.
 * Using `useInject()` outside of a `ContainerProvider` will throw.
 */
export const ContainerContext = createContext<ApplicationContext | null>(null);

ContainerContext.displayName = "ContainerContext";
