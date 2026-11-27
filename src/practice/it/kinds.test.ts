import { describe, expect, it } from 'vitest';
import { parseItalianVerbTables } from '../../languages/it/verb/parse';
import { fixtureLoader } from '../testing';
import { kindOf } from './kinds';

const load = fixtureLoader('it', 'Italian', parseItalianVerbTables);

describe('kindOf', () => {
  it('goes by the class Wiktionary gives, then by the ending', () => {
    expect(kindOf('andare', load('andare'))).toBe('irregular');
    expect(kindOf('parlare', load('parlare'))).toBe('regular');
    expect(kindOf('cercare', undefined)).toBe('spelling');
    expect(kindOf('mangiare', undefined)).toBe('spelling');
  });
});
