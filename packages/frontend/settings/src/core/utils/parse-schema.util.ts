/**
 * @file parse-schema.util.ts
 * @module @stackra/settings/core/utils
 * @description Convert an unknown REST payload into an array of
 *   `ISettingDefinition`. Defensive — the API is on the network so
 *   we validate structure before trusting values.
 */

import type { ISettingDefinition } from "@stackra/contracts";

/**
 * Coerce an unknown payload into a definition array.
 *
 * Accepts both a raw array shape and an object with a `groups` array
 * (the Laravel schema endpoint uses the latter). Entries missing a
 * `key` or `fields` array are dropped rather than throwing, so a
 * single malformed group does not sink the whole load.
 *
 * @param payload - The parsed JSON payload from the schema endpoint.
 * @returns A normalized array of definitions.
 */
export function parseSchemaPayload(payload: unknown): ISettingDefinition[] {
  const list = extractGroups(payload);
  const definitions: ISettingDefinition[] = [];

  for (const raw of list) {
    if (!isRecord(raw)) continue;
    const key = typeof raw.key === "string" ? raw.key : undefined;
    if (!key) continue;

    // We trust the server to send well-typed field / group records;
    // the record guard just makes sure we don't crash on primitives.
    const fields = Array.isArray(raw.fields)
      ? (raw.fields.filter(isRecord) as unknown as ISettingDefinition["fields"])
      : [];

    const groups = Array.isArray(raw.groups)
      ? (raw.groups.filter(isRecord) as unknown as ISettingDefinition["groups"])
      : [];

    definitions.push({
      key,
      label: typeof raw.label === "string" ? raw.label : key,
      description: typeof raw.description === "string" ? raw.description : undefined,
      icon: typeof raw.icon === "string" ? raw.icon : undefined,
      order: typeof raw.order === "number" ? raw.order : 0,
      scope: typeof raw.scope === "string" ? (raw.scope as ISettingDefinition["scope"]) : undefined,
      public: typeof raw.public === "boolean" ? raw.public : undefined,
      permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : undefined,
      writePermissions: Array.isArray(raw.writePermissions)
        ? (raw.writePermissions as string[])
        : undefined,
      dto: null,
      fields,
      groups,
      sections: isRecord(raw.sections)
        ? (raw.sections as ISettingDefinition["sections"])
        : undefined,
      meta: isRecord(raw.meta) ? (raw.meta as ISettingDefinition["meta"]) : undefined,
    });
  }

  return definitions;
}

/**
 * Pull the group list out of either shape the API might return.
 */
function extractGroups(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.groups)) return payload.groups;
  return [];
}

/** Runtime record guard. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
