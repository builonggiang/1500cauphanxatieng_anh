import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Bookmark,
  Activity,
  Snail,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  VolumeX,
} from 'lucide-react';
import { SentenceItem, Unit } from '../data/types';
import { playNativeSpeech } from '../utils/audio';
import { SpeechRecognitionService, evaluateOfflineSpeaking } from '../utils/scoring';
import { recordSentenceProgress } from '../utils/storage';

interface PronunciationViewProps {
  currentUnit: Unit;
  currentSentence: SentenceItem;
  sentenceIndex: number;
  totalSentences: number;
  onSelectSentence: (index: number) => void;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  apiKey?: string;
  playbackRate: number;
}

interface PronounceResult {
  score: number;
  spokenText: string;
  expectedText: string;
  wordDiffs: Array<{
    word: string;
    status: 'correct' | 'missing' | 'extra' | 'different';
    expected?: string;
  }>;
  accuracy: number;
  fluencyScore?: number;
  completenessScore?: number;
  phoneticTips?: string[];
  feedbackVi?: string;
}

export const PronunciationView: React.FC<PronunciationViewProps> = ({
  currentUnit,
  currentSentence,
  sentenceIndex,
  totalSentences,
  onSelectSentence,
  onNextSentence,
  onPrevSentence,
  isBookmarked,
  onToggleBookmark,
  apiKey,
  playbackRate,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<PronounceResult | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showMicGuide, setShowMicGuide] = useState(false);

  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset state on sentence change
    if (isRecording) {
      stopRecording();
    }
    setTranscript('');
    transcriptRef.current = '';
    setResult(null);
    setErrorMsg(null);
  }, [currentSentence.id]);

  useEffect(() => {
    return () => {
      stopAudioVisualizer();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {
      // Microphone permissions might still work via Web Speech API or user has denied media stream
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscript('');
    transcriptRef.current = '';
    setResult(null);

    const recognition = new SpeechRecognitionService('en-US');
    if (!recognition.isSupported()) {
      setIsSupported(false);
      setErrorMsg(
        'Trình duyệt này không hỗ trợ Web Speech API nhận diện giọng nói tự động. Bạn hãy dùng Google Chrome hoặc bấm các nút "⚡ Thử câu mẫu" / gõ câu bên dưới để chấm điểm!'
      );
      return;
    }

    recognitionRef.current = recognition;

    try {
      await startAudioVisualizer();
      setIsRecording(true);

      recognition.start(
        (text) => {
          transcriptRef.current = text;
          setTranscript(text);
        },
        (error) => {
          console.warn('Speech recognition event:', error);
          if (error === 'not-allowed') {
            setErrorMsg(
              'Microphone bị chặn quyền truy cập. Hãy bấm vào biểu tượng Ổ Khóa 🔒 bên trái thanh địa chỉ URL để chọn "Cho phép (Allow) Microphone" rồi thử lại.'
            );
            setShowMicGuide(true);
          } else if (error === 'audio-capture') {
            setErrorMsg('Không tìm thấy thiết bị Microphone. Hãy cắm tai nghe hoặc kiểm tra cài đặt Micro của máy.');
          } else if (error === 'network') {
            setErrorMsg('Lỗi mạng khi kết nối máy chủ giọng nói. Bạn có thể gõ câu hoặc dùng nút "Thử câu mẫu" để chấm điểm.');
          } else if (error === 'no-speech') {
            // Silence detected
          }
          setIsRecording(false);
          stopAudioVisualizer();
        },
        () => {
          setIsRecording(false);
          stopAudioVisualizer();
          // When recognition stops, evaluate whatever was spoken
          const spoken = (transcriptRef.current || transcript).trim();
          if (spoken) {
            handleRecordingComplete(spoken);
          } else {
            setErrorMsg(
              'Microphone chưa thu được giọng nói (hoặc chưa kịp nói). Hãy bấm lại nút Micro để nói to rõ hơn, hoặc bấm nút "⚡ Thử câu đọc mẫu 100%" bên dưới để xem AI chấm điểm ngay!'
            );
          }
        }
      );
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Không thể truy cập microphone');
      setIsRecording(false);
      stopAudioVisualizer();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    stopAudioVisualizer();
    const spoken = (transcriptRef.current || transcript).trim();
    if (spoken) {
      handleRecordingComplete(spoken);
    } else {
      setErrorMsg(
        'Microphone chưa thu được giọng nói. Bạn hãy bấm lại nút Micro để nói lại, hoặc bấm các nút "⚡ Thử câu mẫu" bên dưới để chấm ngay!'
      );
    }
  };

  const handleRecordingComplete = async (spokenInput?: string) => {
    setIsRecording(false);
    stopAudioVisualizer();

    const spoken = (spokenInput ?? transcriptRef.current ?? transcript).trim() || currentSentence.english;

    setIsEvaluating(true);
    setErrorMsg(null);

    // Call server Gemini AI API if available
    try {
      const response = await fetch('/api/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedText: currentSentence.english,
          spokenText: spoken,
          vietnameseMeaning: currentSentence.vietnamese,
          apiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Check if server returned a valid AI response
        if (data && !data.useOffline && !data.error && data.wordAnalysis && (data.overallScore !== undefined || data.accuracy !== undefined)) {
          const overall = data.overallScore ?? data.accuracy ?? data.score ?? 80;
          setResult({
            score: overall,
            spokenText: spoken,
            expectedText: currentSentence.english,
            wordDiffs: data.wordAnalysis || [],
            accuracy: data.accuracy ?? overall,
            fluencyScore: data.fluencyScore ?? Math.max(65, overall - 5),
            completenessScore: data.completenessScore ?? Math.min(100, overall + 5),
            phoneticTips: data.phoneticTips || [],
            feedbackVi: data.feedbackVi || 'Phát âm rất tốt!',
          });
          recordSentenceProgress(currentSentence.id, currentUnit.id, 'pronunciation', overall);
          setIsEvaluating(false);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
          return;
        }
      }
    } catch (e) {
      console.warn('API evaluate-speaking unavailable, falling back to instant offline scoring:', e);
    }

    // High fidelity offline scoring fallback (runs instantly and reliably)
    const offline = evaluateOfflineSpeaking(spoken, currentSentence.english);
    const feedbackVi =
      offline.score >= 90
        ? 'Xuất sắc! Phát âm rất chuẩn xác và rõ ràng như người bản xứ.'
        : offline.score >= 75
        ? 'Tốt lắm! Bạn đã phát âm khá chuẩn. Chú ý các âm cuối (ending sounds s, ed, t, d).'
        : offline.score >= 50
        ? 'Đã nhận diện được một số từ chính. Hãy nghe lại phát âm mẫu và tập đọc từng cụm từ.'
        : 'Cần chú ý phát âm rõ chữ hơn. Hãy nghe giọng mẫu 2-3 lần rồi nói theo nhé!';

    setResult({
      score: offline.score,
      spokenText: spoken,
      expectedText: currentSentence.english,
      wordDiffs: offline.diffs || offline.wordDiffs,
      accuracy: offline.score,
      fluencyScore: Math.max(60, offline.score - 5),
      completenessScore: Math.min(100, offline.score + 5),
      feedbackVi,
      phoneticTips: offline.pronunciationTips || [
        'Chú ý giữ nhịp điệu nối âm (linking sounds)',
        'Đừng bỏ quên ending sounds (s, z, t, d, k)',
      ],
    });
    recordSentenceProgress(currentSentence.id, currentUnit.id, 'pronunciation', offline.score);
    setIsEvaluating(false);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handlePlayModel = (speed = playbackRate) => {
    playNativeSpeech(currentSentence.english, speed);
  };

  // Quick test sample simulations to verify scoring easily
  const handleSimulateSample = (sampleText: string) => {
    setTranscript(sampleText);
    transcriptRef.current = sampleText;
    handleRecordingComplete(sampleText);
  };

  const handleSimulateMissingLastWord = () => {
    const words = currentSentence.english.split(' ');
    const sim = words.length > 1 ? words.slice(0, words.length - 1).join(' ') : words[0];
    handleSimulateSample(sim);
  };

  const handleSimulateWrongWord = () => {
    const words = currentSentence.english.split(' ');
    if (words.length > 0) {
      const copy = [...words];
      copy[0] = 'hello';
      handleSimulateSample(copy.join(' '));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Unit Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                Phần 4: Luyện Phát Âm Chấm Bằng AI
              </span>
              <span className="text-xs text-slate-500">Unit {currentUnit.id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {currentUnit.titleVi} ({currentUnit.titleEn})
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-xl transition-colors border ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title="Lưu câu yêu thích"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
            </button>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              Câu <span className="font-bold text-slate-900 dark:text-white">{sentenceIndex}</span> / {totalSentences}
            </div>
          </div>
        </div>

        {/* Quick sentence switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
          {Array.from({ length: totalSentences }, (_, i) => i + 1).map((num) => {
            const isCurrent = num === sentenceIndex;
            return (
              <button
                key={num}
                onClick={() => onSelectSentence(num)}
                className={`min-w-8 h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                  isCurrent
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Pronunciation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
        {/* Vietnamese prompt */}
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Nghĩa tiếng Việt
          </span>
          <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200">
            "{currentSentence.vietnamese}"
          </p>
        </div>

        {/* Target Sentence in English */}
        <div className="bg-gradient-to-br from-rose-50/50 to-orange-50/40 dark:from-rose-950/20 dark:to-orange-950/10 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Câu tiếng Anh cần phát âm
          </span>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-relaxed">
            {currentSentence.english}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handlePlayModel(playbackRate)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-medium text-sm shadow-sm border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
            >
              <Volume2 className="w-4 h-4" />
              Nghe mẫu bản xứ ({playbackRate}x)
            </button>
            <button
              onClick={() => handlePlayModel(0.75)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title="Nghe chậm tốc độ 0.75x để nghe rõ phát âm từng chữ"
            >
              <Snail className="w-3.5 h-3.5 text-amber-500" />
              Nghe chậm 0.75x
            </button>
          </div>
        </div>

        {/* Recording interactive button */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="relative">
            {/* Visualizer pulse waves when recording */}
            {isRecording && (
              <div
                className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping"
                style={{
                  transform: `scale(${1 + (audioLevel / 100) * 0.8})`,
                  animationDuration: '1.2s',
                }}
              />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isEvaluating}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 ${
                isRecording
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-rose-500/40 ring-4 ring-rose-200 dark:ring-rose-900 scale-105'
                  : 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-rose-500/25 hover:scale-105 hover:shadow-xl'
              }`}
              title={isRecording ? 'Bấm để dừng và chấm điểm' : 'Bấm để bắt đầu đọc'}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-8 h-8 animate-pulse" />
                  <span className="text-[10px] font-bold mt-1">Dừng &amp; Chấm</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  <span className="text-[10px] font-bold mt-1">Bấm để nói</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isRecording ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Đang thu âm... Nói xong hãy bấm lại vào nút để Chấm Điểm!
                </span>
              ) : isEvaluating ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  AI đang chấm điểm phát âm &amp; phân tích từng từ...
                </span>
              ) : (
                'Nhấn vào Micro và đọc to câu tiếng Anh ở trên'
              )}
            </p>
            {isRecording && audioLevel > 0 && (
              <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Live speech transcript during recording or after speaking */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Nội dung nhận diện được (hoặc nhập để chấm):
            </span>
            {/* Quick 1-click test simulation buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleSimulateSample(currentSentence.english)}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium transition"
                title="Thử xem AI chấm câu chuẩn 100% ra sao"
              >
                ⚡ Thử câu chuẩn 100%
              </button>
              <button
                onClick={handleSimulateMissingLastWord}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-medium transition"
                title="Thử xem AI phát hiện câu thiếu từ"
              >
                ⚠️ Thiếu từ
              </button>
              <button
                onClick={handleSimulateWrongWord}
                className="text-xs px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-medium transition"
                title="Thử xem AI phát hiện câu đọc sai từ"
              >
                ✗ Sai từ
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                transcriptRef.current = e.target.value;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRecordingComplete(transcript || currentSentence.english);
                }
              }}
              placeholder={`Bạn hãy bấm Micro và đọc, hoặc bấm "Chấm Điểm Ngay" để chấm câu: "${currentSentence.english}"`}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Có thể chỉnh sửa từ nếu Micro nghe chưa rõ trước khi chấm điểm.
            </span>
            <button
              onClick={() => handleRecordingComplete(transcript || currentSentence.english)}
              disabled={isEvaluating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold text-sm shadow-md hover:from-rose-700 hover:to-orange-600 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              Chấm Điểm Phát Âm Ngay
            </button>
          </div>
        </div>

        {/* Error message or Micro warning */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-semibold">{errorMsg}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleSimulateSample(currentSentence.english)}
                  className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  👉 Bấm thử chấm câu chuẩn 100% ngay
                </button>
                <button
                  onClick={() => setShowMicGuide((prev) => !prev)}
                  className="text-xs px-3 py-1.5 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-semibold rounded-lg hover:bg-amber-200 transition"
                >
                  {showMicGuide ? 'Ẩn hướng dẫn Micro' : '💡 Xem cách bật quyền Micro'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Microphone Troubleshooting Guide */}
        {showMicGuide && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Cách Cho Phép Microphone để web chấm điểm tự động:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Trên Máy Tính (Chrome / Edge):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Nhìn lên thanh địa chỉ web, bấm vào biểu tượng <strong>Ổ Khóa 🔒</strong> hoặc <strong>Cài đặt trang web</strong> cạnh chữ https://</li>
                  <li>Tìm mục <strong>Microphone</strong> và gạt sang <strong>Cho phép (Allow)</strong></li>
                  <li>Bấm phím <strong>F5</strong> để tải lại trang và bấm nút Micro nói lại</li>
                </ol>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Trên Điện Thoại (iOS Safari / Android):</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Vào Cài đặt máy (Settings) → Safari/Chrome → Cho phép Quyền Microphone</li>
                  <li>Mở link web trong app Chrome/Safari (tránh mở bên trong Facebook/Zalo)</li>
                  <li>Khi web hỏi "Muốn truy cập micro?", chọn <strong>Cho phép</strong></li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* AI Pronunciation Evaluation Results */}
        {result && (
          <div ref={resultRef} className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
            {/* Score Banner */}
            <div
              className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
                result.score >= 85
                  ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                  : result.score >= 60
                  ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                  : 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                    result.score >= 85
                      ? 'bg-emerald-500 text-white'
                      : result.score >= 60
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {result.score}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Award
                      className={`w-5 h-5 ${
                        result.score >= 85
                          ? 'text-emerald-600'
                          : result.score >= 60
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    />
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {result.score >= 85
                        ? 'Phát âm tuyệt vời!'
                        : result.score >= 60
                        ? 'Khá tốt - Cần chuẩn hóa ending sounds'
                        : 'Cần luyện tập thêm'}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {result.feedbackVi}
                  </p>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center px-3 py-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-600 dark:text-slate-400">Độ chính xác</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {result.accuracy}%
                  </div>
                </div>
                {result.fluencyScore !== undefined && (
                  <div className="text-center px-3 py-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-600 dark:text-slate-400">Độ trôi chảy</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {result.fluencyScore}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Word-by-word Analysis */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Chi tiết từng từ trong câu phát âm của bạn:
                </span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  (Xanh: Chuẩn • Đỏ: Sai từ • Vàng gạch ngang: Thiếu từ)
                </span>
              </h4>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {result.wordDiffs.map((diff, idx) => {
                  let badge = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
                  let icon = '✓';

                  if (diff.status === 'different') {
                    badge = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                    icon = '✗';
                  } else if (diff.status === 'missing') {
                    badge = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 line-through';
                    icon = '–';
                  } else if (diff.status === 'extra') {
                    badge = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
                    icon = '+';
                  }

                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold ${badge}`}
                      title={
                        diff.status === 'different' && diff.expected
                          ? `Bạn nói "${diff.word}", câu chuẩn là "${diff.expected}"`
                          : undefined
                      }
                    >
                      <span className="text-xs opacity-70 font-mono">{icon}</span>
                      <span>{diff.word}</span>
                      {diff.status === 'different' && diff.expected && (
                        <span className="text-xs opacity-80 font-normal">→ {diff.expected}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Pronunciation Coaching Tips */}
            {result.phoneticTips && result.phoneticTips.length > 0 && (
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Mẹo phát âm từ AI cho câu này:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                  {result.phoneticTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Navigation bottom actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onPrevSentence}
            disabled={sentenceIndex <= 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Câu trước
          </button>

          <button
            onClick={() => {
              setResult(null);
              setTranscript('');
              transcriptRef.current = '';
              setErrorMsg(null);
              startRecording();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Nói lại
          </button>

          <button
            onClick={onNextSentence}
            disabled={sentenceIndex >= totalSentences}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Câu tiếp theo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
