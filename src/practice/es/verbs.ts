/**
 * The Spanish verbs to practise. For now they are only listed on the home
 * page (../upcoming.ts): Spanish cannot be practised until its Wiktionary
 * conjugation tables can be parsed.
 *
 * 200 core verbs of everyday Spanish, for practising conjugation. Chosen by
 * judgement, then checked against how often their forms come up in film
 * subtitles (OpenSubtitles 2018, hermitdave/FrequencyWords): rare verbs and
 * the less common of two near-synonyms swapped for frequent verbs missing.
 * Verbs used mostly as reflexive verbs are listed that way (levantarse,
 * quedarse). Left out: coger, vulgar in much of Latin America, and comenzar,
 * which adds nothing to empezar.
 *
 * In dictionary order.
 */
export const PRACTICE_VERBS: readonly string[] = [
  'abrazar', 'abrir', 'aburrirse', 'acabar', 'aceptar', 'acompañar', 'acordarse', 'acostarse',
  'agradecer', 'alegrarse', 'alquilar', 'andar', 'apagar', 'aparecer', 'aprender', 'arreglar',
  'ayudar', 'bailar', 'bajar', 'beber', 'besar', 'buscar', 'caer', 'callarse', 'cambiar', 'caminar',
  'cantar', 'casarse', 'cenar', 'cerrar', 'cocinar', 'comer', 'compartir', 'comprar', 'conducir',
  'confiar', 'conocer', 'conseguir', 'contar', 'contestar', 'correr', 'cortar', 'costar', 'crecer',
  'creer', 'cruzar', 'cuidar', 'dar', 'deber', 'decidir', 'decir', 'dejar', 'desayunar',
  'descansar', 'despedirse', 'despertarse', 'devolver', 'divertirse', 'doler', 'dormir', 'ducharse',
  'dudar', 'durar', 'echar', 'elegir', 'empezar', 'enamorarse', 'encantar', 'encender', 'encontrar',
  'enfadarse', 'enseñar', 'entender', 'entrar', 'enviar', 'equivocarse', 'escribir', 'escuchar',
  'esperar', 'estar', 'estudiar', 'evitar', 'explicar', 'faltar', 'fumar', 'funcionar', 'ganar',
  'gastar', 'gritar', 'guardar', 'gustar', 'haber', 'hablar', 'hacer', 'importar', 'intentar',
  'invitar', 'ir', 'irse', 'jugar', 'lavarse', 'leer', 'levantarse', 'limpiar', 'llamar',
  'llamarse', 'llegar', 'llevar', 'llorar', 'llover', 'mandar', 'matar', 'mejorar', 'mentir',
  'meter', 'mirar', 'morir', 'mostrar', 'mover', 'mudarse', 'nacer', 'nadar', 'necesitar',
  'ocurrir', 'odiar', 'ofrecer', 'oír', 'oler', 'olvidar', 'organizar', 'pagar', 'parar', 'parecer',
  'pasar', 'pasear', 'pedir', 'pensar', 'perder', 'permitir', 'pintar', 'poder', 'poner',
  'preferir', 'preguntar', 'preocuparse', 'preparar', 'presentar', 'probar', 'prometer', 'quedarse',
  'quejarse', 'querer', 'quitar', 'recibir', 'recoger', 'recomendar', 'reconocer', 'recordar',
  'regalar', 'regresar', 'reír', 'repetir', 'responder', 'robar', 'romper', 'saber', 'sacar',
  'salir', 'saludar', 'seguir', 'sentarse', 'sentir', 'ser', 'servir', 'soler', 'sonar', 'sonreír',
  'soñar', 'subir', 'sufrir', 'suponer', 'tardar', 'tener', 'terminar', 'tirar', 'tocar', 'tomar',
  'trabajar', 'traer', 'tratar', 'usar', 'vender', 'venir', 'ver', 'vestirse', 'viajar', 'visitar',
  'vivir', 'volar', 'volver',
];

/**
 * Shown first on the home page, numbered. Each is a model of a conjugation
 * pattern or a verb used in nearly every sentence: the auxiliaries and tener;
 * a model of each group (hablar, comer, vivir) and of each stem change
 * (pensar: e/ie, volver: o/ue, pedir: e/i, and sentir: e/ie, which changes
 * again in the preterite: sintió); the irregular verbs used most (ir, hacer,
 * and ver, with its imperfect veía); the modal verbs, saber, and conocer for
 * the -zco verbs (conozco); decir; then a reflexive verb (llamarse), for the
 * pronoun's place and the imperative (llámate, llamémonos). Not deber, which
 * conjugates like comer; not venir or poner, whose patterns tener, hacer and
 * decir already show (vengo, pongo).
 */
export const KEY_VERBS: readonly string[] = [
  'ser', 'estar', 'haber', 'tener',
  'hablar', 'comer', 'vivir',
  'pensar', 'volver', 'pedir', 'sentir',
  'ir', 'hacer', 'ver',
  'poder', 'querer', 'saber', 'conocer',
  'decir',
  'llamarse',
];
