import { describe, expect, it } from 'vitest';
import { expandForm } from './notation';

describe('expandForm', () => {
  it('spells out agreement notation', () => {
    expect(expandForm('suis allé(e)')).toEqual(['suis allé', 'suis allée']);
    expect(expandForm('sommes allé(e)s')).toEqual(['sommes allés', 'sommes allées']);
    expect(expandForm('êtes allé(e)(s)')).toEqual(['êtes allé', 'êtes allés', 'êtes allée', 'êtes allées']);
    expect(expandForm('me suis dissous / dissoute')).toEqual(['me suis dissous', 'me suis dissoute']);
    expect(expandForm('mange')).toEqual(['mange']);
  });
});
