/**
 * The viewer's notation for agreement and alternatives, spelled out: what
 * each written form stands for, so that each spelling counts as right.
 */

/** "allé(e)s" -> allés, allées; "allé(e)(s)" -> allé, allée, allés, allées. */
function expandOptional(text: string): string[] {
  const m = text.match(/\(([^()]*)\)/);
  if (!m) return [text];
  const before = text.slice(0, m.index);
  const after = text.slice(m.index! + m[0].length);
  return [...expandOptional(before + after), ...expandOptional(before + m[1] + after)];
}

/**
 * Every spelling a form written in the viewer's notation stands for.
 * Agreement written as alternatives ("me suis dissous / dissoute") repeats
 * the leading words for the shorter alternative.
 */
export function expandForm(form: string): string[] {
  const alternatives = form.split(' / ');
  const firstWords = alternatives[0]!.split(' ');
  const full = alternatives.map((alt, i) => {
    const words = alt.split(' ');
    if (i === 0 || words.length >= firstWords.length) return alt;
    return [...firstWords.slice(0, firstWords.length - words.length), ...words].join(' ');
  });
  return [...new Set(full.flatMap(expandOptional))];
}
