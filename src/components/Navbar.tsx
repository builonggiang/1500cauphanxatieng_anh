import React, { useState } from 'react';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  KeyRound,
  Github,
  Menu,
  Moon,
  Sun,
  Key,
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';
import { PracticeMode, Unit } from '../data/types';

interface NavbarProps {
  currentUnit: Unit;
  activeMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  onToggleSidebar?: () => void;
  onOpenSidebar?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  playbackRate?: number;
  onChangePlaybackRate?: (rate: number) => void;
  onOpenApiKeyModal?: () => void;
  onOpenGithubModal?: () => void;
  onOpenGitHubModal?: () => void;
  completedCount?: number;
  totalCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUnit,
  activeMode,
  onSelectMode,
  onToggleSidebar,
  onOpenSidebar,
  isDarkMode,
  onToggleDarkMode,
  playbackRate = 1.0,
  onChangePlaybackRate,
  onOpenApiKeyModal,
  onOpenGithubModal,
  onOpenGitHubModal,
  completedCount = 0,
  totalCount = 1500,
}) => {
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);

  const toggleSidebarHandler = onToggleSidebar || onOpenSidebar || (() => {});
  const openGithubHandler = onOpenGithubModal || onOpenGitHubModal || (() => {});

  const modes: { id: PracticeMode; label: string; shortLabel: string; icon: any; activeClass: string }[] = [
    {
      id: 'pdf_practice',
      label: '1. Viết Hoàn Thiện (PDF)',
      shortLabel: '1. Viết PDF',
      icon: BookOpen,
      activeClass: 'bg-blue-600 text-white font-bold shadow-sm',
    },
    {
      id: 'listen_answer',
      label: '2. Nghe Đáp Án',
      shortLabel: '2. Nghe mẫu',
      icon: Headphones,
      activeClass: 'bg-emerald-600 text-white font-bold shadow-sm',
    },
    {
      id: 'listen_write',
      label: '3. Nghe & Chép AI',
      shortLabel: '3. Chép AI',
      icon: PenTool,
      activeClass: 'bg-purple-600 text-white font-bold shadow-sm',
    },
    {
      id: 'pronunciation',
      label: '4. Luyện Phát Âm AI',
      shortLabel: '4. Phát âm AI',
      icon: Mic,
      activeClass: 'bg-rose-600 text-white font-bold shadow-sm',
    },
  ];

  const cycleSpeed = () => {
    if (!onChangePlaybackRate) return;
    if (playbackRate === 1.0) onChangePlaybackRate(0.75);
    else if (playbackRate === 0.75) onChangePlaybackRate(1.25);
    else onChangePlaybackRate(1.0);
  };

  const progressPercent = Math.round((completedCount / (totalCount || 1500)) * 100);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Menu trigger & App title */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleSidebarHandler}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                title="Mục lục 50 Units"
                aria-label="Mở danh sách bài học"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                    Phản Xạ Tiếng Anh
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    1500 Câu
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                  Unit {currentUnit.id}: {currentUnit.titleVi}
                </p>
              </div>
            </div>

            {/* Middle: 4 Primary Learning Modes */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSelectMode(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      isActive
                        ? mode.activeClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Tools & Utilities */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Playback speed toggle */}
              {onChangePlaybackRate && (
                <button
                  onClick={cycleSpeed}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                  title="Tốc độ phát âm giọng đọc"
                >
                  {playbackRate}x
                </button>
              )}

              {/* View all answers in Unit */}
              <button
                onClick={() => setShowAnswerSheet(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="Xem toàn bộ 30 câu đáp án của Unit này"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Đáp Án Unit</span>
              </button>

              {/* Gemini API Key */}
              {onOpenApiKeyModal && (
                <button
                  onClick={onOpenApiKeyModal}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  title="Cài đặt Gemini AI Key (tùy chọn)"
                >
                  <Key className="w-4 h-4 text-indigo-500" />
                </button>
              )}

              {/* GitHub Export / Tutorial */}
              <button
                onClick={openGithubHandler}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="Tạo web trên GitHub & Tải dữ liệu JSON"
              >
                <Github className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                <span className="hidden sm:inline">GitHub</span>
              </button>

              {/* Dark mode toggle */}
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  title={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Mini progress bar under navbar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mb-0.5">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.max(2, progressPercent)}%` }}
              title={`Tiến độ hoàn thành: ${completedCount}/${totalCount} câu`}
            />
          </div>
        </div>
      </header>

      {/* Answer key cheat sheet modal for Unit */}
      {showAnswerSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  Đáp Án Toàn Bộ Unit {currentUnit.id}: {currentUnit.titleVi} ({currentUnit.titleEn})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chuẩn xác theo sách gốc — Gồm 30 câu tiếng Anh &amp; tiếng Việt
                </p>
              </div>
              <button
                onClick={() => setShowAnswerSheet(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              {currentUnit.sentences.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                      Câu {item.index}.
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 italic flex-1 ml-2">
                      {item.vietnamese}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 pl-6">
                    {item.english}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setShowAnswerSheet(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
