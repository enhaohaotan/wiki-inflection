import { describe, expect, it } from 'vitest';
import type { InflectionTable } from '../../../core/types';
import { fixtureEntry } from '../../testing';
import { french } from '..';
import { conjugationLayout } from './layout';
import { reflexiveTable } from './reflexive';

describe('reflexiveTable', () => {
  it("builds s'asseoir from asseoir exactly as Wiktionary's own table has it", async () => {
    const [asseoir, sAsseoir] = (await fixtureEntry(french, 'asseoir')).tables;
    expect(sAsseoir!.lemma).toBe("s'asseoir");
    expect(conjugationLayout(reflexiveTable(asseoir!, "s'asseoir"))).toEqual(conjugationLayout(sAsseoir!));
  });

  it('elides before a vowel or h, puts the pronoun after an imperative, and uses s’être', () => {
    const plain: InflectionTable = {
      lang: 'fr',
      pos: 'verb',
      lemma: 'habiller',
      title: 'Conjugation of habiller',
      notes: [],
      meta: { auxiliary: 'avoir' },
      inflections: [
        { tags: ['1', 's', 'pres', 'indc'], forms: ['habille'], ipa: [] },
        { tags: ['1', 'p', 'pres', 'indc'], forms: ['habillons'], ipa: [] },
        { tags: ['2', 's', 'impr'], forms: ['habille'], ipa: [] },
        { tags: ['ppr'], forms: ['habillant'], ipa: [] },
        { tags: ['pp'], forms: ['habillé'], ipa: [] },
      ],
      periphrastic: [
        { key: 'indicative:present perfect', label: '', rule: 'present indicative of avoir + past participle' },
      ],
    };
    const t = reflexiveTable(plain, "s'habiller");
    expect(t.inflections.map((i) => i.forms[0])).toEqual([
      "m'habille",
      'nous habillons',
      'habille-toi',
      "s'habillant",
      'habillé',
      'habillée',
      'habillés',
      'habillées',
    ]);
    expect(t.periphrastic[0]!.rule).toBe("present indicative of s'être + past participle");
    const pc = conjugationLayout(t).moods[0]!.pairs[0]![1]!;
    expect(pc.name).toBe('Passé composé');
    expect(pc.rows[0]!.shown).toEqual(["me suis habillé(e)"]);
  });
});
