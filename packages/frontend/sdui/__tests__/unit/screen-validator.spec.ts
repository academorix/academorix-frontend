/**
 * @file screen-validator.spec.ts
 * @description Unit tests for the SDUI screen validator.
 */

import { describe, expect, it } from "vitest";
import type { ISduiScreen } from "@stackra/contracts";
import { assertValidScreen, validateScreen, type IComponentRegistryLike } from "@/core/validator";

const registry: IComponentRegistryLike = {
  has: (type) => new Set(["Card", "Text", "Button"]).has(type),
};

const validScreen: ISduiScreen = {
  id: "home",
  path: "/",
  title: "Home",
  schemaVersion: 1,
  root: {
    id: "root",
    type: "Card",
    slots: {
      children: [
        { id: "title", type: "Text", props: { value: "Hello" } },
        {
          id: "btn",
          type: "Button",
          actions: {
            onPress: [{ kind: "toast", title: "Clicked", status: "success" }],
          },
        },
      ],
    },
  },
};

describe("screen validator", () => {
  it("accepts a valid screen", () => {
    const result = validateScreen(validScreen, registry);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("reports unknown component types when a registry is supplied", () => {
    const screen: ISduiScreen = {
      ...validScreen,
      root: { id: "root", type: "Unknown", props: {} },
    };
    const result = validateScreen(screen, registry);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => /Unknown component type "Unknown"/.test(i.message))).toBe(
      true,
    );
  });

  it("reports unknown action kinds", () => {
    const screen: ISduiScreen = {
      ...validScreen,
      root: {
        id: "root",
        type: "Card",
        actions: { onPress: [{ kind: "unsupported" as never, to: "/" }] },
      },
    };
    const result = validateScreen(screen, registry);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => /Unknown action kind "unsupported"/.test(i.message))).toBe(
      true,
    );
  });

  it("reports empty node ids and types", () => {
    const screen: ISduiScreen = {
      ...validScreen,
      root: { id: "", type: "", props: {} },
    };
    const result = validateScreen(screen, registry);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });

  it("assertValidScreen throws for invalid input", () => {
    const screen: ISduiScreen = {
      ...validScreen,
      root: { id: "x", type: "", props: {} },
    };
    expect(() => assertValidScreen(screen, registry)).toThrow(/Invalid SDUI screen/);
  });
});
