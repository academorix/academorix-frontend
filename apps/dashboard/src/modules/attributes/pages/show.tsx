/**
 * @file show.tsx
 * @module modules/attributes/pages/show
 *
 * @description
 * Attribute set detail — metadata plus a **live, read-only preview** of the set
 * rendered with the shared {@link AttributeForm}, so admins see exactly how the
 * set appears in real create/edit screens.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { AttributeSet } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { AttributeForm, defaultAttributeValues } from "@/lib/attributes";

/** The attribute set detail page. */
export default function AttributeSetShow(): ReactNode {
  const { result: set, query } = useShow<AttributeSet>({ resource: "attribute-sets" });

  // A default value bag so the preview renders every field in its empty state.
  const previewValues = useMemo(() => (set ? defaultAttributeValues(set) : {}), [set]);

  return (
    <ShowView resource="attribute-sets">
      {query.isLoading || !set ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <Card.Header>
              <Card.Title>{set.code}</Card.Title>
              <Card.Description>
                {set.entity_type} · {set.discriminator_field} = {set.discriminator_value} · v
                {set.version}
              </Card.Description>
            </Card.Header>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Preview</Card.Title>
              <Card.Description>How this set renders in forms (read-only)</Card.Description>
            </Card.Header>
            <Card.Content>
              <AttributeForm
                isReadOnly
                set={set}
                value={previewValues}
                onChange={() => undefined}
              />
            </Card.Content>
          </Card>
        </div>
      )}
    </ShowView>
  );
}
