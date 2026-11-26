/**
 * Fetches the conjugation table of every verb on the practice list from
 * Wiktionary and saves it to src/practice/data/verbTables.json, so the
 * practice page works offline for those verbs.
 *
 *   npm run verbs:fetch              fetch only verbs not saved yet
 *   npm run verbs:fetch -- --all     fetch every verb again
 *
 * Runs the page's own lookup and parsing code (through Vite), so a saved
 * table is exactly what the page would get from the API.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const OUT = new URL('../src/practice/data/verbTables.json', import.meta.url);
const all = process.argv.includes('--all');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The parsers use the browser's DOMParser.
globalThis.DOMParser = new JSDOM('').window.DOMParser;

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, ws: false },
});

try {
  const { practiceLookup } = await server.ssrLoadModule('/src/practice/practiceLookup.ts');
  const { PRACTICE_VERBS } = await server.ssrLoadModule('/src/practice/verbs.ts');
  const { lacksAgreement, storeTable } = await server.ssrLoadModule('/src/practice/savedTables.ts');

  const previous = existsSync(OUT) && !all ? JSON.parse(readFileSync(OUT, 'utf8')) : { tables: {}, missing: {} };
  const tables = { ...previous.tables };
  const missing = {};
  const verbs = PRACTICE_VERBS;
  // Also again any verb saved as another verb's table (se coucher saved as
  // coucher), or saved without its agreed participles.
  const todo = verbs.filter((v) => tables[v]?.lemma !== v || lacksAgreement(tables[v]));
  console.log(`${verbs.length} verbs, ${todo.length} to fetch`);

  const save = () => {
    // Keep only verbs still on the list, in list order.
    const ordered = Object.fromEntries(verbs.filter((v) => tables[v]).map((v) => [v, tables[v]]));
    const file = { fetched: new Date().toISOString().slice(0, 10), tables: ordered, missing };
    writeFileSync(OUT, `${JSON.stringify(file)}\n`);
    return Object.keys(ordered).length;
  };

  for (const [i, verb] of todo.entries()) {
    let result;
    // Wiktionary rate-limits bursts: wait and try again.
    for (let attempt = 0; attempt < 5; attempt++) {
      result = await practiceLookup(verb);
      // A table without its agreed participles was cut short by the rate limit too.
      const incomplete = result.status === 'ok' && lacksAgreement(result.table);
      if (result.status !== 'error' && !incomplete) break;
      const wait = (result.retryAfter ?? 10 * (attempt + 1)) * 1000;
      console.log(`  ${verb}: ${incomplete ? 'participle forms missing' : result.kind}, retrying in ${wait / 1000}s`);
      await sleep(wait);
    }

    const table = result.status === 'ok' ? result.table : undefined;
    if (table) {
      tables[verb] = storeTable(table);
      if (table.lemma !== verb) console.log(`  ${verb}: saved as the table of ${table.lemma}`);
    } else {
      missing[verb] = result.status === 'error' ? `error: ${result.kind}` : result.status;
      console.log(`  ${verb}: ${missing[verb]}`);
    }
    if ((i + 1) % 25 === 0) {
      save();
      console.log(`${i + 1}/${todo.length}`);
    }
    await sleep(1000);
  }

  const saved = save();
  console.log(`saved ${saved} tables; missing: ${Object.keys(missing).join(', ') || 'none'}`);
} finally {
  await server.close();
}
