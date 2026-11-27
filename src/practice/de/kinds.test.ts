import { describe, expect, it } from 'vitest';
import { german } from '../../languages/de';
import { fixtureLoader } from '../../languages/testing';
import { kindOf } from './kinds';

const load = fixtureLoader(german);

describe('kindOf', () => {
  it('goes by the class Wiktionary gives, then by the ending', () => {
    expect(kindOf('fahren', load('fahren'))).toBe('irregular');
    expect(kindOf('sein', load('sein'))).toBe('irregular');
    expect(kindOf('machen', load('machen'))).toBe('regular');
    expect(kindOf('arbeiten', undefined)).toBe('spelling');
    expect(kindOf('öffnen', undefined)).toBe('spelling');
    expect(kindOf('lächeln', undefined)).toBe('spelling');
  });
});
