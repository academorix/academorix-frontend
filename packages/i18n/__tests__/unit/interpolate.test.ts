import { describe, it, expect } from 'vitest';
import { interpolate } from '@/core/utils/interpolate.util';

describe('interpolate', () => {
  it('replaces simple variables', () => {
    expect(interpolate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
  });

  it('replaces multiple variables', () => {
    expect(interpolate('{{greeting}} {{name}}!', { greeting: 'Hi', name: 'Alice' })).toBe(
      'Hi Alice!'
    );
  });

  it('handles missing variables (keeps placeholder)', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });

  it('applies uppercase pipe', () => {
    expect(interpolate('{{ name | uppercase }}', { name: 'world' })).toBe('WORLD');
  });

  it('applies lowercase pipe', () => {
    expect(interpolate('{{ name | lowercase }}', { name: 'HELLO' })).toBe('hello');
  });

  it('applies capitalize pipe', () => {
    expect(interpolate('{{ name | capitalize }}', { name: 'john' })).toBe('John');
  });

  it('handles dot-path variables', () => {
    expect(interpolate('{{user.name}}', { user: { name: 'Alice' } })).toBe('Alice');
  });

  it('returns template unchanged when no args', () => {
    expect(interpolate('Hello {{name}}')).toBe('Hello {{name}}');
  });

  it('handles numeric values', () => {
    expect(interpolate('Count: {{count}}', { count: 42 })).toBe('Count: 42');
  });

  it('respects custom delimiters', () => {
    expect(interpolate('Hello {name}', { name: 'World' }, '{', '}')).toBe('Hello World');
  });
});
