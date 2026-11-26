/**
 * The verbs the Random button picks from, and the ones whose tables are saved
 * with the page for offline practice (see scripts/fetch-verb-tables.mjs).
 *
 * 200 core verbs of everyday French, for practising conjugation: verbs used
 * in all persons and tenses. Drawn from the common verbs of film subtitles
 * (Wiktionary's OpenSubtitles frequency list) and a model verb for each
 * common conjugation pattern, then chosen by judgement. Left out: archaic
 * or rare models (gésir, moudre, rapiécer...), slang and film-dialogue verbs
 * (buter, crever, tuer...), formal or abstract verbs (prouver, gérer,
 * enseigner...), verbs used mostly in one set phrase (valoir: il vaut mieux;
 * suffire: ça suffit; paraître: il paraît que), and derived verbs that add
 * nothing to their base (revoir, renvoyer, remettre...). Verbs used mostly as
 * pronominal verbs are listed that way (se lever, s'occuper), so they are
 * practised as they are said. Verbs mostly met conjugated, which the
 * frequency list undercounts, are added by hand (préférer, s'appeler,
 * se taire).
 *
 * In dictionary order.
 */
export const PRACTICE_VERBS: readonly string[] = [
  'accepter', 'accompagner', 'acheter', 'adorer', 'aider', 'aimer', 'ajouter', 'aller', 'allumer',
  "s'amuser", 'annuler', 'appeler', "s'appeler", 'apporter', 'apprendre', 'arrêter', 'arriver',
  "s'asseoir", 'attendre', 'avoir', 'se battre', 'boire', 'bouger', 'casser', 'changer', 'chanter',
  'chercher', 'choisir', 'commander', 'commencer', 'comprendre', 'compter', 'conduire',
  'connaître', 'continuer', 'se coucher', 'couper', 'courir', 'coûter', 'croire', 'cuisiner',
  'danser', 'se débrouiller', 'décider', 'découvrir', 'déjeuner', 'demander', 'déménager',
  'se dépêcher', 'déranger', 'descendre', 'détester', 'devenir', 'devoir', 'dîner', 'dire',
  'discuter', 'donner', 'dormir', 'écouter', 'écrire', 'embrasser', 'emmener', 'emprunter',
  'enlever', "s'ennuyer", 'entendre', 'entrer', 'envoyer', 'espérer', 'essayer', 'éteindre',
  'être', 'étudier', 'éviter', "s'excuser", 'expliquer', 'faire', 'falloir', 'fermer', 'finir',
  'fumer', 'gagner', 'garder', 'goûter', 'grandir', "s'habiller", 'habiter', 'imaginer',
  "s'inquiéter", "s'intéresser", 'inviter', 'jeter', 'jouer', 'laisser', 'se laver', 'se lever',
  'lire', 'louer', 'manger', 'manquer', 'marcher', 'se marier', 'mentir', 'mettre', 'monter',
  'montrer', 'mourir', 'nager', 'nettoyer', "s'occuper", 'offrir', 'organiser', 'oublier',
  'ouvrir', 'parler', 'partager', 'partir', 'passer', 'payer', 'penser', 'perdre', 'permettre',
  'plaire', 'pleurer', 'pleuvoir', 'porter', 'poser', 'pousser', 'pouvoir', 'préférer', 'prendre',
  'préparer', 'présenter', 'prêter', 'profiter', 'se promener', 'promettre', 'proposer', 'quitter',
  'raconter', 'ranger', 'rappeler', 'rater', 'recevoir', 'reconnaître', 'réfléchir', 'refuser',
  'regarder', 'regretter', 'rejoindre', 'remercier', 'remplir', 'rencontrer', 'rendre', 'rentrer',
  'réparer', 'répéter', 'répondre', 'se reposer', 'réserver', 'rester', 'retourner', 'retrouver',
  'réussir', 'se réveiller', 'revenir', 'rêver', 'rire', 'savoir', 'se sentir', 'sentir', 'servir',
  'sortir', 'sourire', 'se souvenir', 'suivre', 'se taire', 'téléphoner', 'tenir', 'terminer',
  'tirer', 'tomber', 'toucher', 'tourner', 'traduire', 'travailler', 'traverser', 'se tromper',
  'trouver', 'utiliser', 'vendre', 'venir', 'vérifier', 'visiter', 'vivre', 'voir', 'voler',
  'vouloir', 'voyager',
];

/**
 * Shown first on the home page, numbered, in the order a learner needs them:
 * the auxiliaries; aller and faire; the modal verbs with falloir (il faut,
 * standing for the impersonal verbs) and savoir; the other irregular verbs
 * used all the time; a model of each group (parler, finir, rendre); a
 * pronominal verb (s'appeler); and croire. The passive is être and a past
 * participle, so être stands for it.
 */
export const KEY_VERBS: readonly string[] = [
  'être', 'avoir',
  'aller', 'faire',
  'pouvoir', 'vouloir', 'devoir', 'falloir', 'savoir',
  'dire', 'voir', 'prendre', 'venir', 'mettre', 'partir',
  'parler', 'finir', 'rendre',
  "s'appeler", 'croire',
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
