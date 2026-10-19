import { Unit, SentenceItem } from './types';
import { THEMES } from './themes';
import { THEME_1_UNITS } from './units/theme1';
import { THEME_2_UNITS } from './units/theme2';
import { THEME_3_UNITS } from './units/theme3';
import { THEME_4_UNITS } from './units/theme4';
import { THEME_5_UNITS } from './units/theme5';

export * from './types';
export * from './themes';

export const ALL_UNITS: Unit[] = [
  ...THEME_1_UNITS,
  ...THEME_2_UNITS,
  ...THEME_3_UNITS,
  ...THEME_4_UNITS,
  ...THEME_5_UNITS,
];

export const TOTAL_SENTENCES_COUNT = ALL_UNITS.reduce(
  (acc, unit) => acc + unit.sentences.length,
  0
);

export function getUnitById(id: number): Unit | undefined {
  return ALL_UNITS.find((u) => u.id === id);
}

export function getSentencesByUnit(unitId: number): SentenceItem[] {
  const unit = getUnitById(unitId);
  return unit ? unit.sentences : [];
}

export function getSentenceById(sentenceId: string): SentenceItem | undefined {
  for (const unit of ALL_UNITS) {
    const s = unit.sentences.find((item) => item.id === sentenceId);
    if (s) return s;
  }
  return undefined;
}

export function searchSentences(query: string, maxResults = 30): SentenceItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: SentenceItem[] = [];
  for (const unit of ALL_UNITS) {
    for (const s of unit.sentences) {
      if (
        s.vietnamese.toLowerCase().includes(q) ||
        s.english.toLowerCase().includes(q) ||
        s.clues.some((c) => c.term.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q))
      ) {
        results.push(s);
        if (results.length >= maxResults) return results;
      }
    }
  }
  return results;
}
