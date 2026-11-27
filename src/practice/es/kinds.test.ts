import { describe, expect, it } from 'vitest';
import { parseSpanishVerbTables } from '../../languages/es/verb/parse';
import { fixtureLoader } from '../testing';
import { kindOf } from './kinds';

const load = fixtureLoader('es', 'Spanish', parseSpanishVerbTables);

describe('kindOf', () => {
  it('goes by the class Wiktionary gives the table', () => {
    expect(kindOf('ser', load('ser'))).toBe('irregular');
    expect(kindOf('sentir', load('sentir'))).toBe('spelling');
    expect(kindOf('hablar', load('hablar'))).toBe('regular');
    expect(kindOf('buscar', undefined)).toBe('spelling');
  });
});
