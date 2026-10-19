import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Volume2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Eye,
  EyeOff,
  Snail,
  AlertCircle,
} from 'lucide-react';
import { SentenceItem, Unit } from '../data/types';
import { playSpeech, stopSpeech } from '../utils/audio';
import { evaluateOfflineWriting, EvaluationResult } from '../utils/scoring';

interface ListenWriteViewProps {
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

export const ListenWriteView: React.FC<ListenWriteViewProps> = (props) => {
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [revealed, setRevealed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setUserInput('');
    setEvaluation(null);
    setAiAnalysis(null);
    setListenCount(0);
    setRevealed(false);
    stopSpeech();
    setIsPlaying(false);
    // Play audio once automatically to start dictation test
    handlePlayAudio(0.95);
    textareaRef.current?.focus();
  }, [sentence.id]);

  const handlePlayAudio = (rate = 0.95) => {
    setIsPlaying(true);
    setListenCount((prev) => prev + 1);
    playSpeech(sentence.english, {
      rate,
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const handleEvaluate = async () => {
    if (!userInput.trim()) return;

    // Instant local evaluation
    const localEval = evaluateOfflineWriting(userInput, sentence.english);
    setEvaluation(localEval);
    onRecordProgress(localEval.score);

    // Call server Gemini endpoint
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
          setAiAnalysis(data);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setIsSubmittingAi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
        {/* Banner */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Mục 3: Nghe & Chép Câu Chấm Bằng AI
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleBookmark}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                title="Lưu câu yêu thích"
                aria-label="Lưu câu"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-300 text-amber-300' : 'text-white'}`} />
              </button>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/10">
                Câu {sentence.index} / {totalInUnit}
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Unit {unit.id}: {unit.titleVi}
          </h2>
          <p className="text-xs text-emerald-100 opacity-90">
            Lắng nghe giọng bản xứ đọc và tự gõ lại câu hoàn chỉnh bằng tiếng Anh. AI sẽ chấm điểm chính tả & ngữ pháp.
          </p>
        </div>

        {/* Practice Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Audio Listening Control Panel */}
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlayAudio(0.95)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-md transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-emerald-700 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span>{isPlaying ? 'Đang phát...' : 'Nghe giọng bản xứ'}</span>
              </button>

              <button
                onClick={() => handlePlayAudio(0.75)}
                className="flex items-center gap-1.5 px-3.5 py-3 rounded-2xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
                title="Nghe tốc độ chậm để nghe rõ từng âm"
              >
                <Snail className="w-4 h-4 text-emerald-600" />
                <span>Nghe chậm (0.75x)</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Đã nghe: <strong className="text-emerald-600">{listenCount}</strong> lần</span>
              <button
                onClick={() => setRevealed(!revealed)}
                className="hover:underline flex items-center gap-1 text-slate-600 dark:text-slate-300"
              >
                {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {revealed ? 'Ẩn nghĩa tiếng Việt' : 'Xem gợi ý tiếng Việt'}
              </button>
            </div>
          </div>

          {/* Optional Vietnamese Hint if toggled */}
          {revealed && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-sm">
              <span className="font-semibold text-amber-800 dark:text-amber-300">Nghĩa tiếng Việt:</span>{' '}
              <span className="text-slate-800 dark:text-slate-200">{sentence.vietnamese}</span>
            </div>
          )}

          {/* Dictation Input Box */}
          <div className="space-y-2">
            <label
              htmlFor="dictation-input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block"
            >
              Gõ những gì bạn nghe được:
            </label>
            <textarea
              id="dictation-input"
              ref={textareaRef}
              rows={3}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nghe kỹ và nhập câu tiếng Anh vào đây..."
              className="w-full text-base sm:text-lg p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleEvaluate}
              disabled={!userInput.trim() || isSubmittingAi}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmittingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang chấm điểm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Chấm điểm bằng AI</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={currentIndex <= 1}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Câu trước"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={currentIndex >= totalInUnit}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-medium transition-colors"
                title="Câu tiếp theo"
              >
                <span>Câu tiếp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Score Card */}
          {evaluation && (
            <div className="mt-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div
                    className={`text-2xl font-black px-4 py-2 rounded-2xl font-mono ${
                      evaluation.score >= 90
                        ? 'bg-emerald-500 text-white'
                        : evaluation.score >= 70
                        ? 'bg-blue-500 text-white'
                        : evaluation.score >= 50
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {evaluation.score}/100
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {evaluation.score >= 90
                        ? 'Đôi tai tuyệt vời! Hoàn hảo!'
                        : evaluation.score >= 70
                        ? 'Rất tốt! Nghe chính xác phần lớn.'
                        : 'Khá tốt! Hãy chú ý các từ bị thiếu.'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {evaluation.feedback}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handlePlayAudio(0.95)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  Nghe lại đáp án chuẩn
                </button>
              </div>

              {/* Compare Reference Sentence */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Đáp án chuẩn (Reference Answer):
                </span>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{sentence.english}</span>
                </div>
              </div>

              {/* Word by word breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Đối chiếu chi tiết:
                </span>
                <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {evaluation.wordDiffs.map((diff, idx) => (
                    <span
                      key={idx}
                      className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-xl font-mono font-medium ${
                        diff.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : diff.status === 'different'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : diff.status === 'missing'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-dashed border-amber-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {diff.word}
                      {diff.expected && diff.status !== 'correct' && (
                        <span className="text-[10px] ml-1 opacity-75 font-normal">
                          (cần: {diff.expected})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Deep Analysis Box */}
              {aiAnalysis && (
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Giáo viên AI phân tích thói quen nghe:</span>
                  </div>
                  {aiAnalysis.grammarFeedback && (
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {aiAnalysis.grammarFeedback}
                    </p>
                  )}
                  {aiAnalysis.spellingErrors && aiAnalysis.spellingErrors.length > 0 && (
                    <div className="text-rose-700 dark:text-rose-300">
                      <strong>Lỗi chính tả / viết nhầm:</strong>{' '}
                      {aiAnalysis.spellingErrors.join(', ')}
                    </div>
                  )}
                  {aiAnalysis.betterAlternatives && aiAnalysis.betterAlternatives.length > 0 && (
                    <div className="text-slate-700 dark:text-slate-300 pt-1">
                      <strong>Cách nói tương đương:</strong>{' '}
                      <span className="italic">{aiAnalysis.betterAlternatives.join(' / ')}</span>
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
