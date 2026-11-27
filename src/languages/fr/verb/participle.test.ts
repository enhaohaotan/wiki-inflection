import { describe, expect, it } from 'vitest';
import { fixtureEntry, fixtureSection, fixtureTables } from '../../testing';
import { french } from '..';
import { lacksAgreement, parseParticipleForms } from './participle';

const section = (page: string) => fixtureSection(french, page)!;

describe('parseParticipleForms', () => {
  it('reads the agreed forms from the Participle entry', () => {
    expect(parseParticipleForms(section('pp-allé')).map((i) => `${i.tags.join('|')}=${i.forms}`)).toEqual([
      'pp|f|s=allée',
      'pp|m|p=allés',
      'pp|f|p=allées',
    ]);
  });

  it('prefers the Participle entry over an Adjective one and finds it under an etymology', () => {
    expect(parseParticipleForms(section('pp-mort')).map((i) => i.forms[0])).toEqual(['morte', 'morts', 'mortes']);
    expect(parseParticipleForms(section('pp-dissous')).map((i) => i.forms[0])).toEqual([
      'dissoute',
      'dissous',
      'dissoutes',
    ]);
  });
});

describe('lacksAgreement', () => {
  it('spots a table with être whose agreed participles were not fetched', async () => {
    expect(lacksAgreement(fixtureTables(french, 'aller')[0]!)).toBe(true);
    expect(lacksAgreement((await fixtureEntry(french, 'aller')).tables[0]!)).toBe(false);
    // avoir verbs need none
    expect(lacksAgreement(fixtureTables(french, 'manger')[0]!)).toBe(false);
  });
});
