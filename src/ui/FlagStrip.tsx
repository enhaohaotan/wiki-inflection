/** A thin strip in the language's flag colours along the top of the top bar. */
export function FlagStrip({ colors }: { colors: readonly string[] }) {
  return <div className="flag" aria-hidden="true" style={{ background: stripes(colors) }} />;
}

/** Hard-edged bands of equal width, left to right. */
function stripes(colors: readonly string[]): string {
  const width = 100 / colors.length;
  const bands = colors.map((c, i) => `${c} ${i * width}% ${(i + 1) * width}%`);
  return `linear-gradient(to right, ${bands.join(', ')})`;
}
