import { describe, it, expect } from 'vitest';
import { generateRoomCode } from './discordMicSync';

describe('discordMicSync - generateRoomCode', () => {
  it('generates a valid UUID v4 / GUID string', () => {
    const code = generateRoomCode();
    expect(code).toBeDefined();
    // UUID format: 8-4-4-4-12 hex chars
    expect(code).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('guarantees unique session IDs across 50 iterations with 0 collisions', () => {
    const set = new Set<string>();
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
      const code = generateRoomCode();
      expect(set.has(code)).toBe(false);
      set.add(code);
    }
    expect(set.size).toBe(iterations);
  });
});
