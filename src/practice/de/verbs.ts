/**
 * The German verbs to practise. For now they are only listed on the home
 * page (../upcoming.ts): German cannot be practised until its Wiktionary
 * conjugation tables can be parsed.
 *
 * 200 core verbs of everyday German, for practising conjugation. Chosen by
 * judgement, then checked against how often their forms come up in film
 * subtitles (OpenSubtitles 2018, hermitdave/FrequencyWords): rare verbs and
 * the less common of two near-synonyms swapped for frequent verbs missing.
 * Separable verbs are listed as such (anfangen, aufstehen); verbs used mostly
 * as reflexive verbs are listed with sich (sich freuen), sorted under the
 * verb itself.
 *
 * In dictionary order.
 */
export const PRACTICE_VERBS: readonly string[] = [
  'abholen', 'ändern', 'anfangen', 'ankommen', 'anrufen', 'antworten', 'anziehen', 'arbeiten',
  'sich ärgern', 'aufhören', 'aufmachen', 'aufräumen', 'aufstehen', 'aufwachen', 'ausgeben',
  'ausgehen', 'sich ausruhen', 'aussehen', 'aussteigen', 'backen', 'bauen', 'bedeuten',
  'sich beeilen', 'beginnen', 'behalten', 'bekommen', 'benutzen', 'beschreiben', 'bestellen',
  'besuchen', 'bezahlen', 'bitten', 'bleiben', 'brauchen', 'bringen', 'danken', 'dauern', 'denken',
  'diskutieren', 'dürfen', 'duschen', 'einkaufen', 'einladen', 'einsteigen', 'empfehlen',
  'entscheiden', 'sich entschuldigen', 'sich erinnern', 'erklären', 'erlauben', 'erzählen', 'essen',
  'fahren', 'fallen', 'fehlen', 'feiern', 'fernsehen', 'finden', 'fliegen', 'fragen', 'sich freuen',
  'frühstücken', 'sich fühlen', 'funktionieren', 'geben', 'gefallen', 'gehen', 'gehören',
  'genießen', 'gewinnen', 'sich gewöhnen', 'glauben', 'haben', 'halten', 'hängen', 'hassen',
  'heiraten', 'heißen', 'helfen', 'hoffen', 'holen', 'hören', 'sich interessieren', 'kaufen',
  'kennen', 'kochen', 'kommen', 'können', 'kosten', 'sich kümmern', 'lächeln', 'lachen',
  'sich langweilen', 'lassen', 'laufen', 'leben', 'legen', 'leihen', 'lernen', 'lesen', 'lieben',
  'liegen', 'lügen', 'machen', 'malen', 'meinen', 'merken', 'mieten', 'mitkommen', 'mitnehmen',
  'mögen', 'müssen', 'nehmen', 'nennen', 'öffnen', 'packen', 'parken', 'passen', 'passieren',
  'putzen', 'rauchen', 'reden', 'regnen', 'reisen', 'rennen', 'reparieren', 'riechen', 'rufen',
  'sagen', 'schaffen', 'schauen', 'scheinen', 'schenken', 'schicken', 'schlafen', 'schlagen',
  'schließen', 'schmecken', 'schneiden', 'schreiben', 'schwimmen', 'sehen', 'sein', 'sich setzen',
  'singen', 'sitzen', 'sollen', 'sparen', 'spielen', 'sprechen', 'stehen', 'stellen', 'sterben',
  'stören', 'streiten', 'studieren', 'suchen', 'tanzen', 'teilen', 'telefonieren', 'tragen',
  'treffen', 'trinken', 'tun', 'üben', 'übersetzen', 'umziehen', 'sich unterhalten',
  'sich verabschieden', 'verbieten', 'verbringen', 'verdienen', 'vergessen', 'verkaufen',
  'verlassen', 'sich verlieben', 'verlieren', 'vermissen', 'versprechen', 'verstehen', 'versuchen',
  'vorbereiten', 'sich vorstellen', 'wachsen', 'wählen', 'warten', 'waschen', 'wecken', 'weinen',
  'werden', 'werfen', 'wiederholen', 'wissen', 'wohnen', 'wollen', 'wünschen', 'zählen', 'zeigen',
  'ziehen', 'zuhören',
];

/**
 * Shown first on the home page, numbered. Each is a model of a conjugation
 * pattern or a verb used in nearly every sentence: the auxiliaries; models of
 * the weak (machen), strong (fahren: a/ä, sprechen: e/i) and mixed (denken)
 * verbs and of a separable verb (anfangen); the irregular verbs used most;
 * the six modal verbs; and wissen. No reflexive verb: a German reflexive verb
 * conjugates like any other, with mich, dich, sich added.
 */
export const KEY_VERBS: readonly string[] = [
  'sein', 'haben', 'werden',
  'machen', 'fahren', 'sprechen', 'denken', 'anfangen',
  'gehen', 'kommen', 'sehen', 'geben', 'nehmen',
  'können', 'müssen', 'wollen', 'sollen', 'dürfen', 'mögen',
  'wissen',
];
