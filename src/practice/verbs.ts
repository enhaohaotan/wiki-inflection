/**
 * The verbs the Random button picks from, and the ones whose tables are saved
 * with the page for offline practice (see scripts/fetch-verb-tables.mjs).
 *
 * 200 verbs of everyday use to a learner: the common verbs of film subtitles
 * (Wiktionary's OpenSubtitles frequency list), plus a model verb for each
 * common conjugation pattern. Left out: archaic or rare models (gésir,
 * moudre, rapiécer...), slang and film-dialogue verbs (buter, crever, tuer,
 * venger...), formal or abstract verbs (prouver, gérer, maintenir...), and
 * derived verbs that conjugate exactly like their base (revoir, renvoyer,
 * remettre...). Verbs used mostly as pronominal verbs are listed that way
 * (se lever, s'occuper), so they are practised as they are said. Verbs
 * mostly met conjugated, which the frequency list undercounts, are added by
 * hand (préférer, sembler, s'appeler).
 *
 * In dictionary order. être aimé and s'aimer are not on Wiktionary; their
 * tables are kept in ownTables.ts.
 */
export const PRACTICE_VERBS: readonly string[] = [
  'accepter', 'accompagner', 'acheter', 'adorer', 'agir', 'aider', 'aimer', "s'aimer", 'ajouter',
  'aller', 'allumer', "s'amuser", 'annuler', 'appeler', "s'appeler", 'apporter', 'apprendre',
  'arrêter', 'arriver', "s'asseoir", 'attendre', 'avancer', 'avoir', 'boire', 'bouger', 'cacher',
  'casser', 'changer', 'chanter', 'chercher', 'choisir', 'commander', 'commencer', 'comprendre',
  'compter', 'conduire', 'connaître', 'construire', 'continuer', 'se coucher', 'couper', 'courir',
  'coûter', 'croire', 'cuisiner', 'danser', 'décider', 'découvrir', 'décrire', 'déjeuner',
  'demander', 'déménager', 'déranger', 'descendre', 'devenir', 'devoir', 'dîner', 'dire',
  'discuter', 'disparaître', 'donner', 'dormir', 'écouter', 'écrire', 'embrasser', 'emmener',
  'enlever', 'enseigner', 'entendre', 'entrer', 'envoyer', 'espérer', 'essayer', 'éteindre',
  'être', 'être aimé', 'étudier', 'éviter', "s'excuser", 'expliquer', 'faire', 'falloir', 'fermer',
  'finir', 'gagner', 'garder', 'goûter', 'grandir', "s'habiller", 'habiter', 'imaginer',
  "s'inquiéter", 'installer', "s'intéresser", 'inviter', 'jeter', 'jouer', 'laisser', 'laver',
  'se lever', 'lire', 'louer', 'manger', 'manquer', 'marcher', 'se marier', 'mentir', 'mettre',
  'monter', 'montrer', 'mourir', 'nager', 'naître', 'nettoyer', 'obtenir', "s'occuper", 'offrir',
  'organiser', 'oublier', 'ouvrir', 'paraître', 'parler', 'partager', 'partir', 'passer', 'payer',
  'penser', 'perdre', 'permettre', 'plaire', 'pleurer', 'pleuvoir', 'porter', 'poser', 'pouvoir',
  'préférer', 'prendre', 'préparer', 'présenter', 'prêter', 'profiter', 'se promener', 'proposer',
  'quitter', 'raconter', 'ranger', 'rappeler', 'recevoir', 'reconnaître', 'réfléchir', 'refuser',
  'regarder', 'regretter', 'rejoindre', 'remarquer', 'remercier', 'remplir', 'rencontrer',
  'rendre', 'rentrer', 'réparer', 'répéter', 'répondre', 'se reposer', 'rester', 'retourner',
  'retrouver', 'réussir', 'se réveiller', 'revenir', 'rire', 'savoir', 'sembler', 'sentir',
  'servir', 'sortir', 'souffrir', 'sourire', 'se souvenir', 'suffire', 'suivre', 'téléphoner',
  'tenir', 'terminer', 'tomber', 'toucher', 'tourner', 'travailler', 'se tromper', 'trouver',
  'utiliser', 'valoir', 'vendre', 'venir', 'vérifier', 'visiter', 'vivre', 'voir', 'vouloir',
  'voyager',
];

/**
 * A verb from the list, other than `current` so the button always changes the
 * page. `weight` sets how likely each verb is (see weights.ts).
 */
export function randomVerb(
  current?: string,
  random: () => number = Math.random,
  weight: (verb: string) => number = () => 1,
): string {
  const choices = PRACTICE_VERBS.filter((v) => v !== current);
  const weights = choices.map(weight);
  let left = random() * weights.reduce((sum, w) => sum + w, 0);
  for (const [i, w] of weights.entries()) {
    left -= w;
    if (left < 0) return choices[i]!;
  }
  return choices[choices.length - 1]!;
}
