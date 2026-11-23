/**
 * The two French auxiliaries, conjugated in the simple tenses that compound
 * tenses are built from. Fixed and fully regular in use, so kept here rather
 * than fetched.
 */

export type Auxiliary = 'avoir' | 'être';

/** Keys match the tags of the simple tense the auxiliary is put in. */
export type AuxTense =
  | 'pres|indc'
  | 'impf|indc'
  | 'phis'
  | 'futr'
  | 'cond'
  | 'pres|subj'
  | 'impf|subj'
  | 'impr';

/** Person+number -> form, e.g. "1s" -> "suis". */
type Forms = Partial<Record<string, string>>;

const six = (forms: string): Forms => {
  const [s1, s2, s3, p1, p2, p3] = forms.split(' ');
  return { '1s': s1, '2s': s2, '3s': s3, '1p': p1, '2p': p2, '3p': p3 };
};

export const AUXILIARY_FORMS: Record<Auxiliary, Record<AuxTense, Forms>> = {
  être: {
    'pres|indc': six('suis es est sommes êtes sont'),
    'impf|indc': six('étais étais était étions étiez étaient'),
    phis: six('fus fus fut fûmes fûtes furent'),
    futr: six('serai seras sera serons serez seront'),
    cond: six('serais serais serait serions seriez seraient'),
    'pres|subj': six('sois sois soit soyons soyez soient'),
    'impf|subj': six('fusse fusses fût fussions fussiez fussent'),
    impr: { '2s': 'sois', '1p': 'soyons', '2p': 'soyez' },
  },
  avoir: {
    'pres|indc': six('ai as a avons avez ont'),
    'impf|indc': six('avais avais avait avions aviez avaient'),
    phis: six('eus eus eut eûmes eûtes eurent'),
    futr: six('aurai auras aura aurons aurez auront'),
    cond: six('aurais aurais aurait aurions auriez auraient'),
    'pres|subj': six('aie aies ait ayons ayez aient'),
    'impf|subj': six('eusse eusses eût eussions eussiez eussent'),
    impr: { '2s': 'aie', '1p': 'ayons', '2p': 'ayez' },
  },
};

export interface AuxiliaryUse {
  auxiliary: Auxiliary;
  /** Pronominal verbs ("s'être"): me suis, te es -> t'es, ... */
  reflexive: boolean;
}

/**
 * Auxiliaries named in one of Wiktionary's compound-tense rules, in order, e.g.
 * "present indicative of avoir or être + past participle" -> avoir, être.
 */
export function auxiliariesInRule(rule: string): AuxiliaryUse[] {
  const found: AuxiliaryUse[] = [];
  for (const m of rule.matchAll(/(?:^|[\s(])(s['’]être|être|avoir)(?=[\s+),]|$)/g)) {
    const word = m[1]!;
    const use: AuxiliaryUse =
      word === 'avoir'
        ? { auxiliary: 'avoir', reflexive: false }
        : { auxiliary: 'être', reflexive: word !== 'être' };
    if (!found.some((f) => f.auxiliary === use.auxiliary && f.reflexive === use.reflexive)) {
      found.push(use);
    }
  }
  return found;
}
