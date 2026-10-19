export interface ClueItem {
  term: string;
  type?: string;
  meaning: string;
}

export interface SentenceItem {
  id: string; // e.g. "u1_s1"
  index: number; // 1..30
  unitId: number; // 1..50
  vietnamese: string;
  clues: ClueItem[];
  english: string;
}

export interface CollocationItem {
  english: string;
  vietnamese: string;
}

export interface Unit {
  id: number;
  themeId: number;
  themeName: string;
  titleEn: string;
  titleVi: string;
  sentences: SentenceItem[];
  collocations?: CollocationItem[];
  vocabulary?: CollocationItem[];
  sampleDialogues?: { english: string; vietnamese: string }[];
}

export interface Theme {
  id: number;
  titleVi: string;
  unitRange: string;
  iconName: string;
  description: string;
}

export type PracticeMode = 
  | 'pdf_practice'   // 1. Như file PDF, viết hoàn thiện câu
  | 'listen_answer'  // 2. Được nghe đáp án (Native audio listening player)
  | 'listen_write'   // 3. Luyện nghe và tự viết lại câu chấm bằng AI
  | 'pronunciation'; // 4. Luyện phát âm chấm bằng AI
