/**
 * @file registry.spec.ts
 * @description Unit tests for `SettingsRegistry` — verifies both the
 *   DTO-based and JSON-schema-based registration paths converge on
 *   the same `ISettingDefinition` shape.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ControlType } from '@stackra/contracts';

import { Field, Section, Setting, SettingsRegistry } from '@/core';

describe('SettingsRegistry', () => {
  let registry: SettingsRegistry;

  beforeEach(() => {
    registry = new SettingsRegistry();
  });

  describe('registerClass', () => {
    @Setting({ key: 'display', label: 'Display' })
    class DisplaySettings {
      @Field({ control: ControlType.Toggle, label: 'Compact', defaultValue: false })
      compact: boolean = false;
    }

    it('registers a decorated DTO', () => {
      registry.registerClass(DisplaySettings);
      expect(registry.has('display')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('exposes the DTO by findByDto', () => {
      registry.registerClass(DisplaySettings);
      expect(registry.findByDto(DisplaySettings)?.key).toBe('display');
    });

    it('throws when the class is not decorated', () => {
      class Plain {}
      expect(() => registry.registerClass(Plain)).toThrow(/not decorated with @Setting/);
    });

    it('throws when the key is already registered', () => {
      registry.registerClass(DisplaySettings);
      expect(() => registry.registerClass(DisplaySettings)).toThrow(/already registered/);
    });
  });

  describe('registerFromSchema', () => {
    it('registers a schema-declared group', () => {
      registry.registerFromSchema({
        key: 'notifications',
        label: 'Notifications',
        dto: null,
        fields: [
          {
            key: 'email',
            control: 'toggle',
            label: 'Email',
            defaultValue: true,
          },
        ],
        groups: [],
      });
      expect(registry.has('notifications')).toBe(true);
      expect(registry.get('notifications')?.fields).toHaveLength(1);
    });

    it('bulk-registers schemas via registerManyFromSchema', () => {
      registry.registerManyFromSchema([
        { key: 'a', label: 'A', dto: null, fields: [], groups: [] },
        { key: 'b', label: 'B', dto: null, fields: [], groups: [] },
      ]);
      expect(registry.size).toBe(2);
    });
  });

  describe('lookups', () => {
    it('all() returns groups sorted by order', () => {
      registry.registerFromSchema({
        key: 'a',
        label: 'A',
        order: 5,
        dto: null,
        fields: [],
        groups: [],
      });
      registry.registerFromSchema({
        key: 'b',
        label: 'B',
        order: 1,
        dto: null,
        fields: [],
        groups: [],
      });
      const all = registry.all();
      expect(all.map((d) => d.key)).toEqual(['b', 'a']);
    });

    it('clear() empties the registry', () => {
      registry.registerFromSchema({
        key: 'a',
        label: 'A',
        dto: null,
        fields: [],
        groups: [],
      });
      registry.clear();
      expect(registry.size).toBe(0);
    });
  });

  it('preserves @Section metadata on the definition', () => {
    @Setting({ key: 'terminal', label: 'Terminal' })
    class TerminalSettings {
      @Section({ label: 'Hardware' })
      @Field({ control: ControlType.Text, label: 'Receipt', defaultValue: 'thermal' })
      receipt: string = 'thermal';
    }

    registry.registerClass(TerminalSettings);
    const definition = registry.get('terminal');
    expect(definition?.sections?.receipt?.label).toBe('Hardware');
  });
});
