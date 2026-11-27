import { describe, expect, it } from 'vitest';
import { parseGermanVerbTables } from '../../languages/de/verb/parse';
import { fixtureLoader } from '../testing';
import { kindOf } from './kinds';

const load = fixtureLoader('de', 'German', parseGermanVerbTables);

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
