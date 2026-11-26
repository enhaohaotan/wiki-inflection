/**
 * Fetches the conjugation table of every verb on each practice language's
 * list from Wiktionary and saves it to src/practice/<code>/data/verbTables.json,
 * so the practice page works offline for those verbs.
 *
 *   npm run verbs:fetch              every language, only verbs not saved yet
 *   npm run verbs:fetch -- fr        only French
 *   npm run verbs:fetch -- --all     fetch every verb again
 *
 * Runs the page's own lookup and parsing code (through Vite), so a saved
 * table is exactly what the page would get from the API.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const all = args.includes('--all');
const codes = args.filter((a) => !a.startsWith('--'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The parsers use the browser's DOMParser.
globalThis.DOMParser = new JSDOM('').window.DOMParser;

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, ws: false },
});

/** Fetches and saves one language's tables. */
async function fetchLanguage(language, storeTable) {
  if (!language.ready) {
    console.log(`${language.name}: not ready yet, skipped`);
    return;
  }
  const dir = new URL(`../src/practice/${language.code}/data/`, import.meta.url);
  const out = new URL('verbTables.json', dir);
  mkdirSync(dir, { recursive: true });

  const previous = existsSync(out) && !all ? JSON.parse(readFileSync(out, 'utf8')) : { tables: {}, missing: {} };
  const tables = { ...previous.tables };
  const missing = {};
  const verbs = language.verbs;
  // Also again any verb saved as another verb's table (se coucher saved as
  // coucher), or saved incomplete (a French table without its agreed participles).
  const todo = verbs.filter((v) => tables[v]?.lemma !== v || !language.isComplete(tables[v]));
  console.log(`${language.name}: ${verbs.length} verbs, ${todo.length} to fetch`);

  const save = () => {
    // Keep only verbs still on the list, in list order.
    const ordered = Object.fromEntries(verbs.filter((v) => tables[v]).map((v) => [v, tables[v]]));
    const file = { fetched: new Date().toISOString().slice(0, 10), tables: ordered, missing };
    writeFileSync(out, `${JSON.stringify(file)}\n`);
    return Object.keys(ordered).length;
  };

  for (const [i, verb] of todo.entries()) {
    let result;
    // Wiktionary rate-limits bursts: wait and try again.
    for (let attempt = 0; attempt < 5; attempt++) {
      result = await language.lookup(verb);
      // An incomplete table was cut short by the rate limit too.
      const incomplete = result.status === 'ok' && !language.isComplete(storeTable(result.table));
      if (result.status !== 'error' && !incomplete) break;
      const wait = (result.retryAfter ?? 10 * (attempt + 1)) * 1000;
      console.log(`  ${verb}: ${incomplete ? 'incomplete table' : result.kind}, retrying in ${wait / 1000}s`);
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
  console.log(`${language.name}: saved ${saved} tables; missing: ${Object.keys(missing).join(', ') || 'none'}`);
}

try {
  const { PRACTICE_LANGUAGES } = await server.ssrLoadModule('/src/practice/languages.ts');
  const { storeTable } = await server.ssrLoadModule('/src/practice/saved.ts');
  const unknown = codes.filter((c) => !PRACTICE_LANGUAGES.some((l) => l.code === c));
  if (unknown.length > 0) throw new Error(`No practice language ${unknown.join(', ')}`);
  for (const language of PRACTICE_LANGUAGES) {
    if (codes.length === 0 || codes.includes(language.code)) await fetchLanguage(language, storeTable);
  }
} finally {
  await server.close();
}
