/**
 * Pure scoring and text evaluation utilities for speech & text comparisons.
 */

export interface WordDiff {
  word: string;
  status: 'correct' | 'missing' | 'extra' | 'different';
  expected?: string;
}

export interface EvaluationResult {
  score: number;
  grade: 'excellent' | 'good' | 'fair' | 'needs_work';
  similarity: number;
  wordDiffs: WordDiff[];
  diffs?: WordDiff[];
  feedback: string;
  pronunciationTips?: string[];
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a || '';
  const s2 = b || '';
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Calculates string similarity between 0 and 100
 */
export function calculateSimilarity(user: string, target: string): number {
  const normUser = normalizeText(user);
  const normTarget = normalizeText(target);

  if (!normTarget) return 0;
  if (normUser === normTarget) return 100;

  const distance = levenshteinDistance(normUser, normTarget);
  const maxLen = Math.max(normUser.length, normTarget.length);
  if (maxLen === 0) return 100;

  const sim = (1 - distance / maxLen) * 100;
  return Math.max(0, Math.min(100, Math.round(sim)));
}

/**
 * Compares words between user input and target answer
 */
export function compareWords(userInput: string, targetAnswer: string): WordDiff[] {
  const userWords = normalizeText(userInput).split(' ').filter(Boolean);
  const targetWords = normalizeText(targetAnswer).split(' ').filter(Boolean);

  const diffs: WordDiff[] = [];
  const maxIdx = Math.max(userWords.length, targetWords.length);

  for (let i = 0; i < maxIdx; i++) {
    const uWord = userWords[i];
    const tWord = targetWords[i];

    if (uWord && tWord) {
      if (uWord === tWord) {
        diffs.push({ word: uWord, status: 'correct', expected: tWord });
      } else {
        // Check if typo or completely different
        diffs.push({ word: uWord, status: 'different', expected: tWord });
      }
    } else if (uWord && !tWord) {
      diffs.push({ word: uWord, status: 'extra' });
    } else if (!uWord && tWord) {
      diffs.push({ word: tWord, status: 'missing', expected: tWord });
    }
  }

  return diffs;
}

export function evaluateOfflineWriting(userInput: string, targetAnswer: string): EvaluationResult {
  const similarity = calculateSimilarity(userInput, targetAnswer);
  const wordDiffs = compareWords(userInput, targetAnswer);

  let grade: EvaluationResult['grade'] = 'needs_work';
  let feedback = '';

  if (similarity >= 95) {
    grade = 'excellent';
    feedback = 'Hoàn hảo! Bạn đã viết chính xác từng từ và ngữ pháp chuẩn.';
  } else if (similarity >= 80) {
    grade = 'good';
    feedback = 'Rất tốt! Câu của bạn gần như hoàn toàn chính xác, chỉ có một chút khác biệt nhỏ.';
  } else if (similarity >= 55) {
    grade = 'fair';
    feedback = 'Khá ổn! Hãy chú ý các từ bị thiếu hoặc sai chính tả so với đáp án mẫu.';
  } else {
    grade = 'needs_work';
    feedback = 'Cần luyện thêm! Hãy so sánh kỹ từng từ với đáp án chuẩn bên dưới.';
  }

  return {
    score: similarity,
    grade,
    similarity,
    wordDiffs,
    feedback,
  };
}

export function evaluateOfflineSpeaking(spokenText: string, targetAnswer: string): EvaluationResult {
  const similarity = calculateSimilarity(spokenText, targetAnswer);
  const wordDiffs = compareWords(spokenText, targetAnswer);

  let grade: EvaluationResult['grade'] = 'needs_work';
  let feedback = '';
  const tips: string[] = [];

  if (similarity >= 90) {
    grade = 'excellent';
    feedback = 'Phát âm cực kỳ chuẩn xác và rõ ràng!';
  } else if (similarity >= 75) {
    grade = 'good';
    feedback = 'Phát âm tốt! Giọng rõ, hãy chú ý âm đuôi (ending sounds) và nối âm.';
  } else if (similarity >= 50) {
    grade = 'fair';
    feedback = 'Nghe được phần lớn câu, cần mở rộng khẩu hình và nhấn trọng âm rõ hơn.';
  } else {
    grade = 'needs_work';
    feedback = 'Phát âm chưa chuẩn hoặc mic bắt chưa rõ. Hãy nghe lại giọng mẫu và thử lại nhé!';
  }

  // Phonetic tips for common Vietnamese speaker mistakes
  const targetLower = targetAnswer.toLowerCase();
  if (targetLower.includes('s ') || targetLower.endsWith('s')) {
    tips.push('Lưu ý phát âm rõ âm đuôi /s/ hoặc /z/ ở các danh từ số nhiều và động từ.');
  }
  if (targetLower.includes('ed ') || targetLower.endsWith('ed')) {
    tips.push('Chú ý phát âm đuôi -ed (/t/, /d/, hoặc /ɪd/).');
  }
  if (targetLower.includes('th')) {
    tips.push('Âm /θ/ hoặc /ð/ (như trong "the", "with", "this"): đặt đầu lưỡi giữa hai hàm răng.');
  }
  if (targetLower.includes('str') || targetLower.includes('pl') || targetLower.includes('cl')) {
    tips.push('Lưu ý phát âm liền mạch các cụm phụ âm đôi (clusters).');
  }

  return {
    score: similarity,
    grade,
    similarity,
    wordDiffs,
    diffs: wordDiffs,
    feedback,
    pronunciationTips: tips.slice(0, 2),
  };
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private lang: string;

  constructor(lang = 'en-US') {
    this.lang = lang;
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.lang = this.lang;
        this.recognition.interimResults = true;
        this.recognition.continuous = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Web Speech API is not supported in this browser');
      return;
    }

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript + ' ';
          }
        }
      }
      const full = (finalTranscript || interimTranscript).trim();
      if (full) {
        onResult(full, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      const err = event.error || 'speech-error';
      onError(err);
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start error:', e);
      onError(e.message || 'cannot-start-recognition');
    }
  }

  stop() {
    try {
      this.recognition?.stop();
    } catch {}
  }

  abort() {
    try {
      this.recognition?.abort();
    } catch {}
  }
}
