/**
 * @file use-ai-tools.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiTools()` — introspection of registered client
 *   tools + their converted JSON-schema definitions.
 */

import { useEffect, useState } from "react";
import { useInject } from "@stackra/container/react";
import {
  AI_TOOL_CONVERTER,
  AI_TOOL_REGISTRY,
  type IAiClientToolDefinition,
} from "@stackra/contracts";

import { ToolConverter } from "@/core/services/tool-converter.service";
import { ToolRegistry, type IToolEntry } from "@/core/registries/tool.registry";

/** The value returned by {@link useAiTools}. */
export interface IUseAiToolsResult {
  /** Every registered tool entry. */
  tools: IToolEntry[];
  /** JSON-schema tool definitions ready for advertisement. */
  definitions: IAiClientToolDefinition[];
}

/**
 * Reactive snapshot of the registered client tools.
 */
export function useAiTools(): IUseAiToolsResult {
  const registry = useInject<ToolRegistry>(AI_TOOL_REGISTRY);
  const converter = useInject<ToolConverter>(AI_TOOL_CONVERTER);
  const [snapshot, setSnapshot] = useState<IUseAiToolsResult>(() => build(registry, converter));

  useEffect(() => {
    return registry.onChange(() => setSnapshot(build(registry, converter)));
  }, [registry, converter]);

  return snapshot;
}

function build(registry: ToolRegistry, converter: ToolConverter): IUseAiToolsResult {
  return {
    tools: registry.all(),
    definitions: converter.currentDefinitions(),
  };
}
