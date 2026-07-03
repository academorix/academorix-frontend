/**
 * @file list.tsx
 * @module modules/ai/pages/list
 *
 * @description
 * Placeholder surface for the **AI Assistant** — reserves the route, nav entry,
 * and feature gate so the capability can light up without restructuring. No
 * data or model calls yet; it simply describes what's coming.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §18 "AI & Assistants"
 */

import { SparklesIcon } from "@academorix/ui/icons/outline";
import { Card, Separator } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/refine";

/** Planned assistant capabilities, shown as a preview list. */
const PLANNED_CAPABILITIES: { title: string; description: string }[] = [
  {
    title: "Attribute-set suggestions",
    description: "Draft sport-specific attribute sets from a plain-language description.",
  },
  {
    title: "Performance insights",
    description: "Summarize an athlete's test batteries and flag notable trends.",
  },
  {
    title: "Drill recommendations",
    description: "Suggest drills from the library that target a development goal.",
  },
  {
    title: "Natural-language reports",
    description: "Ask questions about the academy and get an aggregated answer.",
  },
];

/** The AI assistant placeholder page. */
export default function AiAssistant(): ReactNode {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <Breadcrumbs />
        <Separator />
        <h1 className="text-2xl font-semibold text-foreground">AI Assistant</h1>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <SparklesIcon aria-hidden="true" className="size-5 text-accent" />
            <Card.Title>Coming soon</Card.Title>
          </div>
          <Card.Description>
            The assistant will help staff work faster across the academy. It isn&apos;t enabled yet.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="flex flex-col gap-4">
            {PLANNED_CAPABILITIES.map((capability) => (
              <li key={capability.title} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">{capability.title}</span>
                <span className="text-sm text-muted">{capability.description}</span>
              </li>
            ))}
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
