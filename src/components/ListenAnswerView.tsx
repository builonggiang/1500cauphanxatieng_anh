import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Repeat,
  Sparkles,
  Eye,
  EyeOff,
  Bookmark,
  ListMusic,
  FastForward,
} from 'lucide-react';
import { SentenceItem, Unit } from '../data/types';
import { playSpeech, stopSpeech } from '../utils/audio';

interface ListenAnswerViewProps {
  unit?: Unit;
  currentUnit?: Unit;
  sentence?: SentenceItem;
  currentSentence?: SentenceItem;
  currentIndex?: number;
  sentenceIndex?: number;
  currentSentenceIndex?: number;
  totalInUnit?: number;
  totalSentences?: number;
  onNext?: () => void;
  onNextSentence?: () => void;
  onPrev?: () => void;
  onPrevSentence?: () => void;
  onSelectIndex?: (index: number) => void;
  onSelectSentence?: (index: number) => void;
  isBookmarked?: boolean;
  bookmarks?: string[];
  onToggleBookmark: () => void;
  playbackRate?: number;
  onChangePlaybackRate?: (rate: number) => void;
}

export const ListenAnswerView: React.FC<ListenAnswerViewProps> = (props) => {
  const unit = props.unit || props.currentUnit!;
  const currentIndex = props.currentIndex ?? props.sentenceIndex ?? props.currentSentenceIndex ?? 1;
  const sentence = props.sentence || props.currentSentence || (unit?.sentences ? unit.sentences[currentIndex - 1] : undefined) || unit.sentences[0];
  const totalInUnit = props.totalInUnit ?? props.totalSentences ?? (unit?.sentences?.length || 30);
  const onNext = props.onNext || props.onNextSentence || (() => {});
  const onPrev = props.onPrev || props.onPrevSentence || (() => {});
  const onSelectIndex = props.onSelectIndex || props.onSelectSentence || (() => {});
  const isBookmarked = props.isBookmarked ?? (props.bookmarks ? props.bookmarks.includes(sentence.id) : false);
  const onToggleBookmark = props.onToggleBookmark;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(props.playbackRate || 0.95);
  const [repeatMode, setRepeatMode] = useState<1 | 2 | 3 | 999>(1);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showEnglishText, setShowEnglishText] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);

  const controllerRef = useRef<{ stop: () => void } | null>(null);

  // Play current sentence
  const playCurrent = (repeatCount = 0) => {
    stopSpeech();
    setIsPlaying(true);
    setCurrentRepeat(repeatCount);

    controllerRef.current = playSpeech(sentence.english, {
      rate: playbackRate,
      onEnd: () => {
        if (repeatCount + 1 < repeatMode) {
          setTimeout(() => {
            playCurrent(repeatCount + 1);
          }, 600);
        } else {
          setIsPlaying(false);
          setCurrentRepeat(0);
          if (autoAdvance && currentIndex < totalInUnit) {
            setTimeout(() => {
              onNext();
            }, 1000);
          }
        }
      },
      onError: () => {
        setIsPlaying(false);
      },
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      playCurrent(0);
    }
  };

  // Reset when sentence changes
  useEffect(() => {
    stopSpeech();
    setIsPlaying(false);
    setCurrentRepeat(0);
    if (autoAdvance) {
      playCurrent(0);
    }
    return () => {
      stopSpeech();
    };
  }, [sentence.id]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Player Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-550 via-indigo-600 to-blue-600 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs">
              Mục 2: Nghe Phát Âm Bản Xứ
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
          <p className="text-xs sm:text-sm text-indigo-100 opacity-90 mt-0.5">
            {unit.titleEn}
          </p>
        </div>

        {/* Audio Visualizer & Content Area */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Animated Waveform when playing */}
          <div className="flex items-center justify-center gap-1.5 h-16 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-indigo-100/60 dark:border-slate-800">
            {[40, 65, 30, 85, 45, 95, 70, 35, 90, 60, 45, 80, 50, 75, 40, 95, 60, 30].map(
              (h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ${
                    isPlaying ? 'animate-pulse' : 'opacity-40'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(16, (h * (i % 2 === 0 ? 0.9 : 1.1)))}%` : '20%',
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              )
            )}
          </div>

          {/* Target Sentence Display */}
          <div className="text-center space-y-4">
            {/* Vietnamese Prompt */}
            {showVietnamese && (
              <div className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
                "{sentence.vietnamese}"
              </div>
            )}

            {/* English Sentence Display */}
            <div className="min-h-[80px] flex items-center justify-center">
              {showEnglishText ? (
                <div className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {sentence.english}
                </div>
              ) : (
                <div className="text-base text-slate-400 italic">
                  (Đã ẩn phụ đề tiếng Anh để bạn tập trung luyện nghe)
                </div>
              )}
            </div>

            {/* Quick Word Hints */}
            {sentence.clues && sentence.clues.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {sentence.clues.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <strong className="text-indigo-600 dark:text-indigo-400">{c.term}</strong>: {c.meaning}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Main Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={onPrev}
                disabled={currentIndex <= 1}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="Câu trước"
                aria-label="Câu trước"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                  isPlaying
                    ? 'bg-rose-600 text-white shadow-rose-200 dark:shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                }`}
                title={isPlaying ? 'Dừng đọc' : 'Nghe phát âm chuẩn'}
                aria-label={isPlaying ? 'Dừng đọc' : 'Phát âm thanh'}
              >
                {isPlaying ? <Pause className="w-7 h-7 sm:w-8 sm:h-8" /> : <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />}
              </button>

              <button
                onClick={onNext}
                disabled={currentIndex >= totalInUnit}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="Câu tiếp theo"
                aria-label="Câu tiếp theo"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Speed & Repeat Settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl">
              {/* Playback speed */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Tốc độ:</span>
                {[0.75, 0.9, 1.0, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackRate(speed)}
                    className={`px-2 py-1 rounded-md font-mono font-medium transition-colors ${
                      playbackRate === speed
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Repeat count */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Lặp lại:</span>
                {[1, 2, 3].map((rep) => (
                  <button
                    key={rep}
                    onClick={() => setRepeatMode(rep as any)}
                    className={`px-2 py-1 rounded-md font-mono font-medium transition-colors ${
                      repeatMode === rep
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {rep}x
                  </button>
                ))}
              </div>

              {/* Toggle visibility */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEnglishText(!showEnglishText)}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    showEnglishText
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-slate-300 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Ẩn/Hiện phụ đề tiếng Anh"
                >
                  {showEnglishText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Chữ Anh</span>
                </button>

                <button
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                    autoAdvance
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-slate-300 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Tự động phát câu tiếp theo khi nghe xong"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Tự động chuyển câu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
