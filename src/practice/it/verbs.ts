/**
 * The verbs the Random button picks from, and the ones whose tables are saved
 * with the page for offline practice (see scripts/fetch-verb-tables.mjs).
 *
 * 200 core verbs of everyday Italian, for practising conjugation. Chosen by
 * judgement, then checked against how often their forms come up in film
 * subtitles (OpenSubtitles 2018, hermitdave/FrequencyWords): rare verbs and
 * the less common of two near-synonyms swapped for frequent verbs missing.
 * Verbs used mostly as reflexive verbs are listed that way (alzarsi,
 * sedersi). Left out: ritornare, which adds nothing to tornare.
 *
 * In dictionary order.
 */
export const PRACTICE_VERBS: readonly string[] = [
  'abbracciare', 'abitare', 'accendere', 'accettare', 'accompagnare', 'accorgersi', 'addormentarsi',
  'affittare', 'aggiungere', 'aiutare', 'alzarsi', 'amare', 'andare', 'annoiarsi', 'annullare',
  'aprire', 'arrabbiarsi', 'arrivare', 'ascoltare', 'aspettare', 'assaggiare', 'attraversare',
  'avere', 'baciare', 'ballare', 'bastare', 'bere', 'buttare', 'cadere', 'cambiare', 'camminare',
  'cantare', 'capire', 'cenare', 'cercare', 'chiacchierare', 'chiamare', 'chiamarsi', 'chiedere',
  'chiudere', 'cominciare', 'comprare', 'condividere', 'conoscere', 'consigliare', 'continuare',
  'controllare', 'correre', 'costare', 'credere', 'crescere', 'cucinare', 'dare', 'decidere',
  'dimenticare', 'dipingere', 'dire', 'discutere', 'disegnare', 'diventare', 'divertirsi',
  'dormire', 'dovere', 'dubitare', 'durare', 'entrare', 'essere', 'evitare', 'fare', 'fermarsi',
  'fidarsi', 'finire', 'firmare', 'fumare', 'funzionare', 'giocare', 'girare', 'guadagnare',
  'guardare', 'guidare', 'imparare', 'incontrare', 'innamorarsi', 'insegnare', 'invitare',
  'lamentarsi', 'lasciare', 'lavare', 'lavorare', 'leggere', 'mancare', 'mandare', 'mangiare',
  'mentire', 'mettere', 'morire', 'mostrare', 'muoversi', 'nascere', 'nascondere', 'nuotare',
  'occuparsi', 'odiare', 'offrire', 'ordinare', 'organizzare', 'pagare', 'parlare', 'partire',
  'passare', 'pensare', 'perdere', 'perdonare', 'permettere', 'piacere', 'piangere', 'piovere',
  'portare', 'potere', 'preferire', 'prendere', 'prenotare', 'preoccuparsi', 'preparare',
  'presentare', 'prestare', 'promettere', 'provare', 'pulire', 'raccontare', 'regalare', 'restare',
  'ricevere', 'riconoscere', 'ricordare', 'ridere', 'riempire', 'rimanere', 'ringraziare',
  'riposare', 'rispondere', 'riuscire', 'rompere', 'rubare', 'salire', 'salutare', 'sapere',
  'sbagliare', 'sbrigarsi', 'scappare', 'scegliere', 'scendere', 'scherzare', 'scoprire',
  'scrivere', 'scusarsi', 'sedersi', 'seguire', 'sembrare', 'sentire', 'sentirsi', 'servire',
  'smettere', 'sognare', 'sorridere', 'spegnere', 'spendere', 'sperare', 'spiegare', 'spingere',
  'sposare', 'spostare', 'stare', 'studiare', 'succedere', 'suonare', 'svegliarsi', 'tagliare',
  'tenere', 'tirare', 'toccare', 'togliere', 'tornare', 'tradurre', 'trasferirsi', 'trovare',
  'urlare', 'usare', 'uscire', 'vedere', 'vendere', 'venire', 'vergognarsi', 'vestirsi',
  'viaggiare', 'vincere', 'visitare', 'vivere', 'volare', 'volere',
];

/**
 * Shown first on the home page, numbered. Each is a model of a conjugation
 * pattern or a verb used in nearly every sentence: the auxiliaries; a model
 * of each group (parlare, credere, dormire) and of the -isc- verbs (finire);
 * the irregular verbs used most; the modal verbs and sapere; dire, vedere,
 * prendere and piacere (mi piace); then a reflexive verb (chiamarsi), as
 * reflexive verbs take essere and agree in the compound tenses.
 */
export const KEY_VERBS: readonly string[] = [
  'essere', 'avere',
  'parlare', 'credere', 'dormire', 'finire',
  'andare', 'fare', 'stare', 'dare', 'venire',
  'potere', 'volere', 'dovere', 'sapere',
  'dire', 'vedere', 'prendere', 'piacere',
  'chiamarsi',
];
