import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('shared-core', () => {
  it('expone una versión', () => {
    expect(VERSION).toBe('0.1.0');
  });
});