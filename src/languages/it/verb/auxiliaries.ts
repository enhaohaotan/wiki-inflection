/**
 * The two Italian auxiliaries, conjugated in the simple tenses the compound
 * tenses are built from. Fixed and regular in use, so kept here rather than
 * fetched.
 */

/** The auxiliaries' forms in each simple tense, io to loro, by the tense's tags. */
export const AUXILIARY_FORMS: Record<string, Record<string, string[]>> = {
  avere: {
    'pres|ind': ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
    'impf|ind': ['avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano'],
    phis: ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero'],
    fut: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'],
    cond: ['avrei', 'avresti', 'avrebbe', 'avremmo', 'avreste', 'avrebbero'],
    'pres|sub': ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
    'impf|sub': ['avessi', 'avessi', 'avesse', 'avessimo', 'aveste', 'avessero'],
  },
  essere: {
    'pres|ind': ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
    'impf|ind': ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'],
    phis: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'],
    fut: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'],
    cond: ['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'],
    'pres|sub': ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
    'impf|sub': ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'],
  },
};
