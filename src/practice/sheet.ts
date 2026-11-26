import type { ConjugationLayout } from '../languages/conjugation';
import type { Sheet } from './types';

/**
 * A conjugation as exercises: one blank per row of the layout. The same for
 * every language; each language only lays its table out (see
 * languages/conjugation.ts).
 */
export function buildSheet(layout: ConjugationLayout): Sheet {
  return {
    lemma: layout.lemma,
    pos: layout.pos,
    sections: layout.moods.map((mood) => ({
      id: mood.id,
      name: mood.name,
      short: mood.short,
      pairs: mood.pairs.map((pair) =>
        pair.map((tense) => ({
          name: tense.name,
          compound: tense.compound,
          folded: tense.folded,
          blanks: tense.rows.map((row, i) => ({
            id: `${mood.id}/${tense.name}/${i}`,
            label: row.label,
            forms: row.shown,
            accepted: row.accepted,
          })),
        })),
      ),
    })),
  };
}
