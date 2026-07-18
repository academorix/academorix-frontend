/**
 * @file json-view-section.component.tsx
 * @module @stackra/ui/react/components/json-view-section
 * @description Expandable JSON/metadata viewer for admin detail pages.
 *   Renders a collapsible section containing formatted JSON with copy-to-clipboard.
 */

"use client";

import { Disclosure, Button } from "@heroui/react";
import React, { useMemo, useState, useCallback } from "react";

import type { JsonViewSectionProps } from "./json-view-section.interface";

/**
 * JsonViewSection — Expandable formatted JSON viewer.
 *
 * Renders raw metadata or API responses as prettified JSON inside
 * a collapsible disclosure panel. Includes a copy-to-clipboard button.
 *
 * @param props - Component props.
 * @returns The JSON view section element.
 *
 * @example
 * ```tsx
 * <JsonViewSection
 *   title="Raw Metadata"
 *   data={{ key: "value", nested: { array: [1, 2, 3] } }}
 *   defaultExpanded={false}
 * />
 * ```
 */
export const JsonViewSection = React.memo(function JsonViewSection({
  data,
  title = "Raw Data",
  defaultExpanded = false,
  showCopy = true,
  maxHeight = "400px",
  indentation = 2,
  className,
}: JsonViewSectionProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => JSON.stringify(data, null, indentation), [data, indentation]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonString]);

  return (
    <Disclosure
      className={className}
      data-component="json-view-section"
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
    >
      <Disclosure.Heading>
        <Disclosure.Trigger className="border-default-200 hover:bg-default-50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium text-foreground transition-colors">
          <span>{title}</span>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <div className="border-default-200 bg-default-50 relative mt-2 rounded-lg border">
          {/* Copy button */}
          {showCopy && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                aria-label={copied ? "Copied" : "Copy JSON"}
                size="sm"
                variant="ghost"
                onPress={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          )}

          {/* JSON content */}
          <pre
            className="text-foreground-700 overflow-auto p-4 font-mono text-xs leading-relaxed"
            style={{ maxHeight }}
          >
            <code>{jsonString}</code>
          </pre>
        </div>
      </Disclosure.Content>
    </Disclosure>
  );
});

JsonViewSection.displayName = "JsonViewSection";
