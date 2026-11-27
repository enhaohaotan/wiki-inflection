import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { french } from '../../languages/fr';
import { findLanguageSection, parsePage } from '../../wiktionary/page';
import { randomVerb } from '../random';
import { kindOf } from './kinds';
import { PRACTICE_VERBS } from './verbs';

function table(verb: string) {
  const html = readFileSync(resolve(process.cwd(), 'test/fixtures/fr', `${verb}.html`), 'utf8');
  return french.parse(findLanguageSection(parsePage(html), 'French')!, verb).tables[0]!;
}

describe('kindOf', () => {
  it('tells regular, spelling-change and irregular verbs apart from their tables', () => {
    expect(kindOf('passer', table('passer'))).toBe('regular');
    expect(kindOf('voler', table('voler'))).toBe('regular');
    expect(kindOf('finir', table('finir'))).toBe('regular');
    expect(kindOf('manger', table('manger'))).toBe('spelling');
    expect(kindOf('aller', table('aller'))).toBe('irregular');
    expect(kindOf('mourir', table('mourir'))).toBe('irregular');
    expect(kindOf('suivre', table('suivre'))).toBe('irregular');
    expect(kindOf("s'asseoir", table('asseoir'))).toBe('irregular');
  });

  it('goes by the ending when there is no table', () => {
    expect(kindOf('se coucher', undefined)).toBe('regular');
    expect(kindOf('envoyer', undefined)).toBe('irregular');
    expect(kindOf('prendre', undefined)).toBe('irregular');
  });
});

describe('randomVerb', () => {
  it('picks heavier verbs more often', () => {
    const heavy = PRACTICE_VERBS[5]!;
    const weight = (v: string) => (v === heavy ? 1000 : 1);
    const picks = Array.from({ length: 100 }, (_, i) => randomVerb(PRACTICE_VERBS, undefined, () => i / 100, weight));
    expect(picks.filter((v) => v === heavy).length).toBeGreaterThan(80);
  });
});
