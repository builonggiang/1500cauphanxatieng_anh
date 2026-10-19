import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  CheckCircle,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Bookmark,
  Share2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { SentenceItem, Unit } from '../data/types';
import { playSpeech, stopSpeech } from '../utils/audio';
import { evaluateOfflineWriting, EvaluationResult } from '../utils/scoring';

interface PdfPracticeViewProps {
  unit?: Unit;
  currentUnit?: Unit;
  sentence?: SentenceItem;
  currentSentence?: SentenceItem;
  currentIndex?: number;
  sentenceIndex?: number;
  totalInUnit?: number;
  totalSentences?: number;
  onNext?: () => void;
  onNextSentence?: () => void;
  onPrev?: () => void;
  onPrevSentence?: () => void;
  onSelectIndex?: (index: number) => void;
  onSelectSentence?: (index: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onRecordProgress?: (score: number) => void;
  apiKey?: string;
  playbackRate?: number;
}

export const PdfPracticeView: React.FC<PdfPracticeViewProps> = (props) => {
  const unit = props.unit || props.currentUnit!;
  const sentence = props.sentence || props.currentSentence!;
  const currentIndex = props.currentIndex ?? props.sentenceIndex ?? 1;
  const totalInUnit = props.totalInUnit ?? props.totalSentences ?? (unit?.sentences?.length || 30);
  const onNext = props.onNext || props.onNextSentence || (() => {});
  const onPrev = props.onPrev || props.onPrevSentence || (() => {});
  const onSelectIndex = props.onSelectIndex || props.onSelectSentence || (() => {});
  const isBookmarked = props.isBookmarked;
  const onToggleBookmark = props.onToggleBookmark;
  const onRecordProgress = props.onRecordProgress || (() => {});
  const [userInput, setUserInput] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when sentence changes
  useEffect(() => {
    setUserInput('');
    setEvaluation(null);
    setShowAnswer(false);
    setAiFeedback(null);
    stopSpeech();
    setIsPlayingAudio(false);
    inputRef.current?.focus();
  }, [sentence.id]);

  const handleCheck = async () => {
    if (!userInput.trim()) return;

    // Fast local evaluation
    const localEval = evaluateOfflineWriting(userInput, sentence.english);
    setEvaluation(localEval);
    onRecordProgress(localEval.score);

    // Try server-side AI evaluation if possible
    setIsSubmittingAi(true);
    try {
      const res = await fetch('/api/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userInput.trim(),
          targetAnswer: sentence.english,
          vietnamesePrompt: sentence.vietnamese,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && !data.useOffline && !data.error) {
          setAiFeedback(data);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsSubmittingAi(false);
    }
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    playSpeech(sentence.english, {
      rate: 0.95,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!evaluation) {
        handleCheck();
      } else {
        onNext();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Unit Banner Header like the original PDF worksheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {unit.themeName}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              UNIT {unit.id} — {unit.titleEn.toUpperCase()} ({unit.titleVi.toUpperCase()})
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-xl transition-colors border ${
                isBookmarked
                  ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title={isBookmarked ? 'Bỏ lưu câu này' : 'Lưu câu quan trọng'}
              aria-label="Lưu câu"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>

            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              Câu {sentence.index} / {totalInUnit}
            </span>
          </div>
        </div>

        {/* Quick Sentence Navigator Bar (1 to 30) */}
        <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-850 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-slate-500 shrink-0 mr-1 hidden sm:inline">
            Chọn câu:
          </span>
          {Array.from({ length: totalInUnit }).map((_, i) => {
            const num = i + 1;
            const isCurrent = num === sentence.index;
            return (
              <button
                key={num}
                onClick={() => onSelectIndex(num)}
                className={`w-7 h-7 shrink-0 rounded-md text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label={`Câu ${num}`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Exercise Worksheet Area */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Vietnamese sentence prompt */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                  {sentence.index}.
                </span>
                <span className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {sentence.vietnamese}
                </span>
              </div>

              <button
                onClick={handlePlayAudio}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  isPlayingAudio
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/60'
                }`}
                title="Nghe phát âm chuẩn câu này"
                aria-label="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF-Style Clue / Vocabulary hints */}
          {showHints && sentence.clues && sentence.clues.length > 0 && (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                Gợi ý từ vựng & cấu trúc (như trong sách PDF):
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {sentence.clues.map((clue, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-semibold text-blue-950 dark:text-blue-200">
                      {clue.term}
                    </span>
                    {clue.type && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-mono">
                        ({clue.type})
                      </span>
                    )}
                    <span className="text-slate-600 dark:text-slate-400">: {clue.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ruled Arrow Input Line (Like → _________________ in the PDF) */}
          <div className="space-y-3 pt-2">
            <label
              htmlFor="pdf-sentence-input"
              className="text-xs font-medium text-slate-500 dark:text-slate-400 block"
            >
              Viết câu tiếng Anh hoàn chỉnh:
            </label>
            <div className="relative flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-bold text-slate-400 shrink-0 select-none">
                →
              </span>
              <input
                id="pdf-sentence-input"
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Gõ câu tiếng Anh hoàn chỉnh vào đây..."
                autoComplete="off"
                spellCheck="false"
                className="w-full text-base sm:text-lg px-4 py-3 bg-white dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none rounded-t-lg transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Kiểm tra đáp án (Enter)
              </button>

              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
              >
                {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={currentIndex <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-600 dark:text-slate-300 transition-colors"
                title="Câu trước"
                aria-label="Câu trước"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={currentIndex >= totalInUnit}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-medium transition-colors"
                title="Câu tiếp theo"
                aria-label="Câu tiếp theo"
              >
                <span>Câu tiếp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Result / Diff Comparison */}
          {(evaluation || showAnswer) && (
            <div className="mt-6 p-5 rounded-2xl border transition-all space-y-4 bg-slate-50/80 dark:bg-slate-850 border-slate-200 dark:border-slate-800">
              {/* Score header */}
              {evaluation && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs uppercase font-bold px-2.5 py-1 rounded-md ${
                        evaluation.grade === 'excellent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : evaluation.grade === 'good'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : evaluation.grade === 'fair'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {evaluation.grade === 'excellent'
                        ? 'Xuất sắc'
                        : evaluation.grade === 'good'
                        ? 'Rất tốt'
                        : evaluation.grade === 'fair'
                        ? 'Khá'
                        : 'Cần sửa'}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Điểm: {evaluation.score}/100
                    </span>
                  </div>

                  <button
                    onClick={handlePlayAudio}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Nghe phát âm chuẩn
                  </button>
                </div>
              )}

              {/* Target answer comparison */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Đáp án chuẩn (ANSWER KEY):
                </div>
                <div className="text-base sm:text-lg font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span>{sentence.english}</span>
                  <button
                    onClick={handlePlayAudio}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                    title="Nghe đáp án"
                    aria-label="Nghe đáp án chuẩn"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Word by word breakdown */}
              {evaluation && evaluation.wordDiffs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-500">
                    Đối chiếu từng từ của bạn:
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {evaluation.wordDiffs.map((diff, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-md font-mono ${
                          diff.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : diff.status === 'different'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 line-through'
                            : diff.status === 'missing'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-dashed border-amber-400'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                        title={diff.expected ? `Cần là: ${diff.expected}` : ''}
                      >
                        {diff.word}
                        {diff.expected && diff.status !== 'correct' && (
                          <span className="text-[10px] ml-1 opacity-75 font-normal">
                            ({diff.expected})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Deep evaluation if available */}
              {isSubmittingAi && (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>AI đang phân tích ngữ pháp và cấu trúc câu...</span>
                </div>
              )}

              {aiFeedback && (
                <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nhận xét chi tiết từ giáo viên AI:</span>
                  </div>
                  {aiFeedback.grammarFeedback && (
                    <p className="text-slate-800 dark:text-slate-200">
                      {aiFeedback.grammarFeedback}
                    </p>
                  )}
                  {aiFeedback.betterAlternatives && aiFeedback.betterAlternatives.length > 0 && (
                    <div className="pt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Cách diễn đạt tự nhiên khác:
                      </span>{' '}
                      <span className="italic text-blue-700 dark:text-blue-300">
                        {aiFeedback.betterAlternatives.join(' / ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
