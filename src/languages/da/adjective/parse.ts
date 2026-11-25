import type { Inflection, InflectionTable } from '../../../core/types';
import { cleanText } from '../../../wiktionary/page';

/**
 * Extracts a Danish adjective. Most adjectives list their forms in the
 * headword line, each after an italic label:
 *
 *   stor (neuter stort, plural and definite singular attributive store,
 *         comparative større, superlative (predicative) størst,
 *         superlative (attributive) største)
 *
 * Some forms are tagged, some (lille) are not, so the labels are what is
 * read. A few adjectives (interessant) have an "Inflection" table instead.
 *
 * Slots, used as tags: common (the headword), neuter, definite, plural,
 * comparative, superlative+predicative, superlative+attributive.
 */

type Slot = 'common' | 'neuter' | 'definite' | 'plural' | 'comparative' | 'superlative-pred' | 'superlative-attr';

const SLOT_TAGS: Record<Slot, string[]> = {
  common: ['common'],
  neuter: ['neuter'],
  definite: ['definite'],
  plural: ['plural'],
  comparative: ['comparative'],
  'superlative-pred': ['superlative', 'predicative'],
  'superlative-attr': ['superlative', 'attributive'],
};

const ALL_POSITIVE: Slot[] = ['common', 'neuter', 'definite', 'plural'];

/** Which slots a headword label covers, e.g. "plural and definite singular attributive". */
function slotsOfLabel(label: string): Slot[] {
  const l = label.toLowerCase();
  if (/indeclinable/.test(l)) return ALL_POSITIVE;
  if (/superlative/.test(l)) {
    if (/predicative/.test(l)) return ['superlative-pred'];
    if (/attributive/.test(l)) return ['superlative-attr'];
    return ['superlative-pred', 'superlative-attr'];
  }
  if (/comparative/.test(l)) return ['comparative'];
  const slots: Slot[] = [];
  if (/neuter/.test(l)) slots.push('neuter');
  if (/\bdefinite/.test(l)) slots.push('definite');
  if (/plural/.test(l)) slots.push('plural');
  return slots;
}

class Forms {
  private bySlot = new Map<Slot, string[]>();
  add(slot: Slot, form: string) {
    const text = form.trim();
    if (!text || /^[-–—]$/.test(text)) return;
    const forms = this.bySlot.get(slot) ?? [];
    if (!forms.includes(text)) forms.push(text);
    this.bySlot.set(slot, forms);
  }
  toInflections(): Inflection[] {
    return [...this.bySlot].map(([slot, forms]) => ({ tags: SLOT_TAGS[slot], forms, ipa: [] }));
  }
}

function fromHeadword(line: Element, forms: Forms): void {
  let slots: Slot[] = [];
  for (const node of Array.from(line.children)) {
    if (node.matches('strong.headword')) forms.add('common', cleanText(node));
    else if (node.tagName === 'I') {
      if (cleanText(node).toLowerCase() === 'or') continue; // a variant of the same form
      slots = slotsOfLabel(cleanText(node));
      // "(indeclinable)" has no form after it: every slot is the headword.
      if (/indeclinable/i.test(cleanText(node))) {
        const head = cleanText(line.querySelector('strong.headword'));
        for (const s of ALL_POSITIVE) forms.add(s, head);
      }
    } else if (node.tagName === 'B') {
      for (const s of slots) forms.add(s, cleanText(node));
    }
  }
}

const TABLE_ROWS: Record<string, Slot> = {
  'indefinite common singular': 'common',
  'indefinite neuter singular': 'neuter',
  plural: 'plural',
  'definite attributive': 'definite',
};

/** The "Inflection" table: rows by gender/number/definiteness, columns by degree. */
function fromTable(table: Element, forms: Forms): void {
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const label = cleanText(row.querySelector('th'))
      .toLowerCase()
      .replace(/\d+$/, '')
      .trim();
    const slot = TABLE_ROWS[label];
    if (!slot) continue;
    const cells = Array.from(row.querySelectorAll('td')).map((td) =>
      Array.from(td.querySelectorAll('.Latn')).map(cleanText),
    );
    const [positive = [], comparative = [], superlative = []] = cells;
    positive.forEach((f) => forms.add(slot, f));
    comparative.forEach((f) => forms.add('comparative', f));
    superlative.forEach((f) => forms.add(slot === 'definite' ? 'superlative-attr' : 'superlative-pred', f));
  }
}

/** The adjective in one "Adjective" section, or null if it lists no forms. */
export function parseDanishAdjective(adjective: Element, pageTitle: string): InflectionTable | null {
  const forms = new Forms();
  const line = adjective.querySelector('.headword-line');
  if (line) fromHeadword(line, forms);
  const table = adjective.querySelector('table.inflection-table');
  if (table) fromTable(table, forms);

  const inflections = forms.toInflections();
  // Only the headword itself: nothing to show.
  if (inflections.every((i) => i.tags[0] === 'common')) return null;

  const lemma = inflections.find((i) => i.tags[0] === 'common')?.forms[0] ?? pageTitle;
  return {
    lang: 'da',
    pos: 'adjective',
    lemma,
    title: `Inflection of ${lemma}`,
    inflections,
    periphrastic: [],
    notes: [],
    meta: {},
  };
}
