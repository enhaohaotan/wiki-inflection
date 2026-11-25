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
  const { lookup } = await server.ssrLoadModule('/src/features/lookup/lookup.ts');
  const { french } = await server.ssrLoadModule('/src/languages/fr/index.ts');
  const { PRACTICE_VERBS } = await server.ssrLoadModule('/src/practice/verbs.ts');
  const { OWN_LEMMAS } = await server.ssrLoadModule('/src/practice/ownTables.ts');
  const { practiceTable, storeTable } = await server.ssrLoadModule('/src/practice/savedTables.ts');

  const previous = existsSync(OUT) && !all ? JSON.parse(readFileSync(OUT, 'utf8')) : { tables: {}, missing: {} };
  const tables = { ...previous.tables };
  const missing = {};
  // s'aimer and être aimé are not on Wiktionary; their tables are in ownTables.ts.
  const verbs = PRACTICE_VERBS.filter((v) => !OWN_LEMMAS.includes(v));
  const todo = verbs.filter((v) => !tables[v]);
  console.log(`${verbs.length} verbs, ${todo.length} to fetch`);

  const save = () => {
    // Keep only verbs still on the list, in list order.
    const ordered = Object.fromEntries(verbs.filter((v) => tables[v]).map((v) => [v, tables[v]]));
    const file = { fetched: new Date().toISOString().slice(0, 10), tables: ordered, missing };
    writeFileSync(OUT, `${JSON.stringify(file)}\n`);
  };

  for (const [i, verb] of todo.entries()) {
    let result;
    // Wiktionary rate-limits bursts: wait and try again.
    for (let attempt = 0; attempt < 5; attempt++) {
      result = await lookup(french, verb);
      if (result.status !== 'error') break;
      const wait = (result.retryAfter ?? 10 * (attempt + 1)) * 1000;
      console.log(`  ${verb}: ${result.kind}, retrying in ${wait / 1000}s`);
      await sleep(wait);
    }

    const table = result.status === 'ok' ? practiceTable(result) : undefined;
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

  save();
  console.log(`saved ${Object.keys(tables).length} tables; missing: ${Object.keys(missing).join(', ') || 'none'}`);
} finally {
  await server.close();
}
