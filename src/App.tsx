import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ALL_UNITS,
  THEMES,
  getUnitById,
  searchSentences,
} from './data';
import { PracticeMode, Unit, SentenceItem } from './data/types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PdfPracticeView } from './components/PdfPracticeView';
import { ListenAnswerView } from './components/ListenAnswerView';
import { ListenWriteView } from './components/ListenWriteView';
import { PronunciationView } from './components/PronunciationView';
import { GithubExportModal } from './components/GithubExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import {
  getUserSettings,
  saveUserSettings,
  getBookmarks,
  toggleBookmark as toggleBookmarkStorage,
  getStoredApiKey,
  getUserProgress,
} from './utils/storage';
import { Sparkles, Trophy, BookOpen, Volume2, Mic, PenTool } from 'lucide-react';

export default function App() {
  const [currentUnitId, setCurrentUnitId] = useState<number>(1);
  const [sentenceIndex, setSentenceIndex] = useState<number>(1); // 1..30
  const [activeMode, setActiveMode] = useState<PracticeMode>('pdf_practice');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Sync settings and state on mount
  useEffect(() => {
    const settings = getUserSettings();
    setCurrentUnitId(settings.currentUnitId || 1);
    setSentenceIndex(settings.currentSentenceIndex || 1);
    setActiveMode(settings.lastActiveMode || 'pdf_practice');
    setPlaybackRate(settings.playbackRate || 1.0);

    setBookmarks(getBookmarks());
    setApiKey(getStoredApiKey() || '');

    // Load progress
    const progress = getUserProgress();
    const map: Record<string, boolean> = {};
    progress.forEach((p) => {
      map[p.sentenceId] = true;
    });
    setCompletedMap(map);
  }, []);

  // Update theme class on HTML document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Save last unit/sentence/mode
  useEffect(() => {
    saveUserSettings({
      currentUnitId,
      currentSentenceIndex: sentenceIndex,
      lastActiveMode: activeMode,
      playbackRate,
    });
  }, [currentUnitId, sentenceIndex, activeMode, playbackRate]);

  const currentUnit = useMemo(() => {
    return getUnitById(currentUnitId) || ALL_UNITS[0];
  }, [currentUnitId]);

  const currentSentence: SentenceItem = useMemo(() => {
    const found = currentUnit.sentences.find((s) => s.index === sentenceIndex);
    return found || currentUnit.sentences[0];
  }, [currentUnit, sentenceIndex]);

  const isCurrentBookmarked = useMemo(() => {
    return bookmarks.includes(currentSentence.id);
  }, [bookmarks, currentSentence.id]);

  const handleToggleBookmark = useCallback(() => {
    const updated = toggleBookmarkStorage(currentSentence.id);
    setBookmarks(updated);
  }, [currentSentence.id]);

  const handleNextSentence = useCallback(() => {
    if (sentenceIndex < currentUnit.sentences.length) {
      setSentenceIndex((prev) => prev + 1);
    } else if (currentUnitId < 50) {
      // Transition to next unit
      setCurrentUnitId((prev) => prev + 1);
      setSentenceIndex(1);
    }
  }, [sentenceIndex, currentUnit.sentences.length, currentUnitId]);

  const handlePrevSentence = useCallback(() => {
    if (sentenceIndex > 1) {
      setSentenceIndex((prev) => prev - 1);
    } else if (currentUnitId > 1) {
      // Transition to previous unit's last sentence
      const prevUnit = getUnitById(currentUnitId - 1);
      if (prevUnit) {
        setCurrentUnitId(currentUnitId - 1);
        setSentenceIndex(prevUnit.sentences.length);
      }
    }
  }, [sentenceIndex, currentUnitId]);

  const handleSelectUnit = useCallback((unitId: number) => {
    setCurrentUnitId(unitId);
    setSentenceIndex(1);
  }, []);

  const handleSelectSentence = useCallback((index: number) => {
    setSentenceIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        handleNextSentence();
      } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        handlePrevSentence();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextSentence, handlePrevSentence]);

  // Overall statistics
  const totalCompletedCount = Object.keys(completedMap).length;
  const progressPercent = Math.min(100, Math.round((totalCompletedCount / 1500) * 100));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        playbackRate={playbackRate}
        onChangePlaybackRate={setPlaybackRate}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenGithubModal={() => setIsGithubModalOpen(true)}
        currentUnit={currentUnit}
        completedCount={totalCompletedCount}
        totalCount={1500}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentUnit={currentUnit}
          currentUnitId={currentUnitId}
          currentSentenceIndex={sentenceIndex}
          onSelectUnit={handleSelectUnit}
          onSelectSentence={handleSelectSentence}
          bookmarks={bookmarks}
          completedMap={completedMap}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Quick Stats & Progress Bar Ribbon */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Tiến độ hoàn thành 1500 câu
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {totalCompletedCount} / 1500 câu ({progressPercent}%)
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-[140px] max-w-xs hidden sm:block">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, progressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Mode switch pills for quick access */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveMode('pdf_practice')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    activeMode === 'pdf_practice'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="1. Viết hoàn thiện câu như trong file PDF"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">1. Viết (PDF)</span>
                </button>

                <button
                  onClick={() => setActiveMode('listen_answer')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    activeMode === 'listen_answer'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="2. Nghe toàn bộ đáp án bản xứ"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">2. Nghe đáp án</span>
                </button>

                <button
                  onClick={() => setActiveMode('listen_write')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    activeMode === 'listen_write'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="3. Luyện nghe và tự viết lại câu chấm bằng AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">3. Nghe chép AI</span>
                </button>

                <button
                  onClick={() => setActiveMode('pronunciation')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition ${
                    activeMode === 'pronunciation'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="4. Luyện phát âm chấm bằng AI"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">4. Luyện phát âm AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Render Active Practice Mode View */}
          {activeMode === 'pdf_practice' && (
            <PdfPracticeView
              currentUnit={currentUnit}
              currentSentence={currentSentence}
              sentenceIndex={sentenceIndex}
              totalSentences={currentUnit.sentences.length}
              onSelectSentence={handleSelectSentence}
              onNextSentence={handleNextSentence}
              onPrevSentence={handlePrevSentence}
              isBookmarked={isCurrentBookmarked}
              onToggleBookmark={handleToggleBookmark}
              apiKey={apiKey}
              playbackRate={playbackRate}
            />
          )}

          {activeMode === 'listen_answer' && (
            <ListenAnswerView
              currentUnit={currentUnit}
              currentSentenceIndex={sentenceIndex}
              onSelectSentence={handleSelectSentence}
              playbackRate={playbackRate}
              onChangePlaybackRate={setPlaybackRate}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeMode === 'listen_write' && (
            <ListenWriteView
              currentUnit={currentUnit}
              currentSentence={currentSentence}
              sentenceIndex={sentenceIndex}
              totalSentences={currentUnit.sentences.length}
              onSelectSentence={handleSelectSentence}
              onNextSentence={handleNextSentence}
              onPrevSentence={handlePrevSentence}
              isBookmarked={isCurrentBookmarked}
              onToggleBookmark={handleToggleBookmark}
              apiKey={apiKey}
              playbackRate={playbackRate}
            />
          )}

          {activeMode === 'pronunciation' && (
            <PronunciationView
              currentUnit={currentUnit}
              currentSentence={currentSentence}
              sentenceIndex={sentenceIndex}
              totalSentences={currentUnit.sentences.length}
              onSelectSentence={handleSelectSentence}
              onNextSentence={handleNextSentence}
              onPrevSentence={handlePrevSentence}
              isBookmarked={isCurrentBookmarked}
              onToggleBookmark={handleToggleBookmark}
              apiKey={apiKey}
              playbackRate={playbackRate}
            />
          )}
        </main>
      </div>

      {/* GitHub Setup & Export Modal */}
      <GithubExportModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyChange={(newKey) => setApiKey(newKey)}
      />
    </div>
  );
}
