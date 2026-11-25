import type { ComponentType } from 'react';
import { DanishHome, DanishNumeralPage, DanishPronounPage } from './da/home/DanishHome';

interface LanguageHome {
  /** The home page. */
  Home: ComponentType;
  /** Footer link back to it from other pages. */
  link: string;
  /** Pages it links to, by the name in the address (#/da/@talord). */
  pages: Record<string, ComponentType>;
}

/** Home pages for the languages that have one. */
export const homeViews: Record<string, LanguageHome> = {
  da: {
    Home: DanishHome,
    link: 'Home',
    pages: { '@stedord': DanishPronounPage, '@talord': DanishNumeralPage },
  },
};
