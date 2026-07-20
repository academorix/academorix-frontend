/**
 * Container React Context
 *
 * Holds an `ApplicationContext` reference that React hooks use to
 * resolve providers. The resolver is provided by `<ContainerProvider>`.
 *
 * @module react/contexts/container
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
