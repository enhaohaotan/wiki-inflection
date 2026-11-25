import { pronounFor } from '../languages/fr/verb/layout';
import { toPageTitle } from '../wiktionary/client';
import { ALL_PERSONS, expandForm, IMPERATIVE_PERSONS, KINDS, startsFolded, type Blank, type Sheet } from './sheet';

/**
 * Conjugations kept here because Wiktionary has no page for them: the
 * pronominal model s'aimer and the passive model être aimé. Written out
 * form by form, in the same notation as the tables built from Wiktionary:
 * one form per person, "(e)" and "(e)s" for agreement.
 */

interface OwnTense {
  fr: string;
  /** One form per person: six, or three for the imperative. */
  forms: string[];
}

interface OwnMood {
  id: string;
  fr: string;
  /** A simple tense and, beside it, the compound tense built on it. */
  pairs: [OwnTense, OwnTense?][];
}

interface OwnConjugation {
  lemma: string;
  /** Shown beside the headword. */
  label: string;
  moods: OwnMood[];
  participles: OwnTense[];
}

/** "m'aime | t'aimes | ..." -> one form per person. */
const t = (fr: string, forms: string): OwnTense => ({ fr, forms: forms.split(' | ') });

const S_AIMER: OwnConjugation = {
  lemma: "s'aimer",
  label: 'forme pronominale',
  moods: [
    {
      id: 'indicatif',
      fr: 'Indicatif',
      pairs: [
        [
          t('Présent', "m'aime | t'aimes | s'aime | nous aimons | vous aimez | s'aiment"),
          t('Passé composé', "me suis aimé(e) | t'es aimé(e) | s'est aimé(e) | nous sommes aimé(e)s | vous êtes aimé(e)s | se sont aimé(e)s"),
        ],
        [
          t('Imparfait', "m'aimais | t'aimais | s'aimait | nous aimions | vous aimiez | s'aimaient"),
          t('Plus-que-parfait', "m'étais aimé(e) | t'étais aimé(e) | s'était aimé(e) | nous étions aimé(e)s | vous étiez aimé(e)s | s'étaient aimé(e)s"),
        ],
        [
          t('Passé simple', "m'aimai | t'aimas | s'aima | nous aimâmes | vous aimâtes | s'aimèrent"),
          t('Passé antérieur', 'me fus aimé(e) | te fus aimé(e) | se fut aimé(e) | nous fûmes aimé(e)s | vous fûtes aimé(e)s | se furent aimé(e)s'),
        ],
        [
          t('Futur simple', "m'aimerai | t'aimeras | s'aimera | nous aimerons | vous aimerez | s'aimeront"),
          t('Futur antérieur', 'me serai aimé(e) | te seras aimé(e) | se sera aimé(e) | nous serons aimé(e)s | vous serez aimé(e)s | se seront aimé(e)s'),
        ],
      ],
    },
    {
      id: 'conditionnel',
      fr: 'Conditionnel',
      pairs: [
        [
          t('Présent', "m'aimerais | t'aimerais | s'aimerait | nous aimerions | vous aimeriez | s'aimeraient"),
          t('Passé', 'me serais aimé(e) | te serais aimé(e) | se serait aimé(e) | nous serions aimé(e)s | vous seriez aimé(e)s | se seraient aimé(e)s'),
        ],
      ],
    },
    {
      id: 'subjonctif',
      fr: 'Subjonctif',
      pairs: [
        [
          t('Présent', "m'aime | t'aimes | s'aime | nous aimions | vous aimiez | s'aiment"),
          t('Passé', 'me sois aimé(e) | te sois aimé(e) | se soit aimé(e) | nous soyons aimé(e)s | vous soyez aimé(e)s | se soient aimé(e)s'),
        ],
        [
          t('Imparfait', "m'aimasse | t'aimasses | s'aimât | nous aimassions | vous aimassiez | s'aimassent"),
          t('Plus-que-parfait', 'me fusse aimé(e) | te fusses aimé(e) | se fût aimé(e) | nous fussions aimé(e)s | vous fussiez aimé(e)s | se fussent aimé(e)s'),
        ],
      ],
    },
    {
      id: 'imperatif',
      fr: 'Impératif',
      // No compound imperative for a pronominal verb.
      pairs: [[t('Présent', 'aime-toi | aimons-nous | aimez-vous')]],
    },
  ],
  participles: [t('Présent', "s'aimant"), t('Passé', "s'étant aimé(e)(s)")],
};

const ETRE_AIME: OwnConjugation = {
  lemma: 'être aimé',
  label: 'voix passive',
  moods: [
    {
      id: 'indicatif',
      fr: 'Indicatif',
      pairs: [
        [
          t('Présent', 'suis aimé(e) | es aimé(e) | est aimé(e) | sommes aimé(e)s | êtes aimé(e)s | sont aimé(e)s'),
          t('Passé composé', 'ai été aimé(e) | as été aimé(e) | a été aimé(e) | avons été aimé(e)s | avez été aimé(e)s | ont été aimé(e)s'),
        ],
        [
          t('Imparfait', 'étais aimé(e) | étais aimé(e) | était aimé(e) | étions aimé(e)s | étiez aimé(e)s | étaient aimé(e)s'),
          t('Plus-que-parfait', 'avais été aimé(e) | avais été aimé(e) | avait été aimé(e) | avions été aimé(e)s | aviez été aimé(e)s | avaient été aimé(e)s'),
        ],
        [
          t('Passé simple', 'fus aimé(e) | fus aimé(e) | fut aimé(e) | fûmes aimé(e)s | fûtes aimé(e)s | furent aimé(e)s'),
          t('Passé antérieur', 'eus été aimé(e) | eus été aimé(e) | eut été aimé(e) | eûmes été aimé(e)s | eûtes été aimé(e)s | eurent été aimé(e)s'),
        ],
        [
          t('Futur simple', 'serai aimé(e) | seras aimé(e) | sera aimé(e) | serons aimé(e)s | serez aimé(e)s | seront aimé(e)s'),
          t('Futur antérieur', 'aurai été aimé(e) | auras été aimé(e) | aura été aimé(e) | aurons été aimé(e)s | aurez été aimé(e)s | auront été aimé(e)s'),
        ],
      ],
    },
    {
      id: 'conditionnel',
      fr: 'Conditionnel',
      pairs: [
        [
          t('Présent', 'serais aimé(e) | serais aimé(e) | serait aimé(e) | serions aimé(e)s | seriez aimé(e)s | seraient aimé(e)s'),
          t('Passé', 'aurais été aimé(e) | aurais été aimé(e) | aurait été aimé(e) | aurions été aimé(e)s | auriez été aimé(e)s | auraient été aimé(e)s'),
        ],
      ],
    },
    {
      id: 'subjonctif',
      fr: 'Subjonctif',
      pairs: [
        [
          t('Présent', 'sois aimé(e) | sois aimé(e) | soit aimé(e) | soyons aimé(e)s | soyez aimé(e)s | soient aimé(e)s'),
          t('Passé', 'aie été aimé(e) | aies été aimé(e) | ait été aimé(e) | ayons été aimé(e)s | ayez été aimé(e)s | aient été aimé(e)s'),
        ],
        [
          t('Imparfait', 'fusse aimé(e) | fusses aimé(e) | fût aimé(e) | fussions aimé(e)s | fussiez aimé(e)s | fussent aimé(e)s'),
          t('Plus-que-parfait', 'eusse été aimé(e) | eusses été aimé(e) | eût été aimé(e) | eussions été aimé(e)s | eussiez été aimé(e)s | eussent été aimé(e)s'),
        ],
      ],
    },
    {
      id: 'imperatif',
      fr: 'Impératif',
      pairs: [[t('Présent', 'sois aimé(e) | soyons aimé(e)s | soyez aimé(e)s')]],
    },
  ],
  participles: [t('Présent', 'étant aimé(e)(s)'), t('Passé', 'ayant été aimé(e)(s)')],
};

const OWN: readonly OwnConjugation[] = [S_AIMER, ETRE_AIME];

/** The verbs kept here, for the Random button. */
export const OWN_LEMMAS: readonly string[] = OWN.map((c) => c.lemma);

function toSheet(c: OwnConjugation): Sheet {
  const sections: Sheet['sections'] = c.moods.map((mood) => {
    const kind = KINDS[mood.id] ?? 'plain';
    const persons = kind === 'imperative' ? IMPERATIVE_PERSONS : ALL_PERSONS;
    return {
      id: mood.id,
      fr: mood.fr,
      pairs: mood.pairs.map((pair) =>
        pair
          .filter((tense): tense is OwnTense => tense !== undefined)
          .map((tense, i) => ({
            fr: tense.fr,
            compound: i === 1,
            folded: startsFolded(mood.id, tense.fr, i === 1),
            blanks: tense.forms.map((form, row): Blank => {
              const [person, num] = persons[row]!;
              return {
                id: `${mood.id}/${tense.fr}/${row}`,
                // Elided as written before the answer: j’ai été aimé(e).
                label: pronounFor(person, num, kind, form),
                forms: [form],
                accepted: expandForm(form),
              };
            }),
          })),
      ),
    };
  });

  sections.push({
    id: 'participe',
    fr: 'Participe',
    pairs: [
      [
        {
          fr: 'Participe',
          compound: false,
          folded: false,
          blanks: c.participles.map((p) => ({
            id: `participe/${p.fr}`,
            label: p.fr.toLowerCase(),
            forms: p.forms,
            accepted: p.forms.flatMap(expandForm),
          })),
        },
      ],
    ],
  });

  return { lemma: c.lemma, pos: 'verb', posLabel: c.label, sections };
}

/** The sheet for `word` when it is one of the verbs kept here (s'aimer, s’aimer, Être aimé). */
export function ownSheet(word: string): Sheet | undefined {
  const title = toPageTitle(word).toLocaleLowerCase('fr');
  const found = OWN.find((c) => c.lemma === title);
  return found && toSheet(found);
}
