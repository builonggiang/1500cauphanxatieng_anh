import React, { useState } from 'react';
import {
  X,
  Bookmark,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Search,
} from 'lucide-react';
import { THEMES } from '../data/themes';
import { ALL_UNITS, getUnitById } from '../data/index';
import { Unit } from '../data/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnit?: Unit;
  currentUnitId?: number;
  currentSentenceIndex: number;
  onSelectUnit: (unit: Unit | number) => void;
  onSelectSentence?: (index: number) => void;
  onSelectSentenceIndex?: (index: number) => void;
  completedSentenceIds?: Set<string>;
  completedMap?: Record<string, boolean>;
  bookmarks: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentUnit: propUnit,
  currentUnitId,
  currentSentenceIndex,
  onSelectUnit,
  onSelectSentence,
  onSelectSentenceIndex,
  completedSentenceIds,
  completedMap,
  bookmarks,
}) => {
  const activeUnit = propUnit || (currentUnitId ? getUnitById(currentUnitId) : undefined) || ALL_UNITS[0];
  const [expandedThemeId, setExpandedThemeId] = useState<number>(activeUnit ? activeUnit.themeId : 1);
  const [filterMode, setFilterMode] = useState<'all' | 'bookmarks'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleSentenceClick = (idx: number) => {
    if (onSelectSentence) onSelectSentence(idx);
    else if (onSelectSentenceIndex) onSelectSentenceIndex(idx);
    onClose();
  };

  const handleUnitClick = (unit: Unit) => {
    onSelectUnit(unit.id);
  };

  const isSentenceCompleted = (sentenceId: string) => {
    if (completedMap && completedMap[sentenceId]) return true;
    if (completedSentenceIds && completedSentenceIds.has(sentenceId)) return true;
    return false;
  };

  const completedCount = completedSentenceIds
    ? completedSentenceIds.size
    : completedMap
    ? Object.keys(completedMap).length
    : 0;

  const filteredUnits = ALL_UNITS.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.titleVi.toLowerCase().includes(term) ||
      u.titleEn.toLowerCase().includes(term) ||
      `unit ${u.id}`.includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl z-10 animate-slideRight">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Mục Lục 50 Unit (1500 Câu)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn chủ đề và câu cần luyện tập
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            aria-label="Đóng bảng mục lục"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input in sidebar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Lọc tên Unit (VD: chào hỏi, interview...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả 50 Unit
            </button>
            <button
              onClick={() => setFilterMode('bookmarks')}
              className={`flex-1 py-1 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${
                filterMode === 'bookmarks'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Bookmark className="w-3 h-3" />
              Đã lưu ({bookmarks.length})
            </button>
          </div>
        </div>

        {/* Unit Accordion List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {THEMES.map((theme) => {
            const isExpanded = expandedThemeId === theme.id || searchTerm.length > 0;
            const themeUnits = filteredUnits.filter((u) => u.themeId === theme.id);

            if (themeUnits.length === 0) return null;

            return (
              <div
                key={theme.id}
                className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
              >
                {/* Theme Header Toggle */}
                <button
                  onClick={() => setExpandedThemeId(isExpanded ? 0 : theme.id)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Chủ đề {theme.id}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {theme.titleVi}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Units under this theme */}
                {isExpanded && (
                  <div className="p-2 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/60">
                    {themeUnits.map((unit) => {
                      const isCurrentUnit = activeUnit && activeUnit.id === unit.id;
                      const completedInUnit = unit.sentences.filter((s) =>
                        isSentenceCompleted(s.id)
                      ).length;

                      return (
                        <div key={unit.id} className="space-y-1">
                          <button
                            onClick={() => handleUnitClick(unit)}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isCurrentUnit
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                Unit {unit.id}: {unit.titleEn}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {unit.titleVi}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                completedInUnit === 30
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {completedInUnit}/30
                            </span>
                          </button>

                          {/* If this is the active unit, show sentence quick jump grid (1-30) */}
                          {isCurrentUnit && (
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                                Câu hỏi (1 - 30):
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {unit.sentences.map((sent) => {
                                  const isSelected = currentSentenceIndex === sent.index;
                                  const isDone = isSentenceCompleted(sent.id);
                                  return (
                                    <button
                                      key={sent.id}
                                      onClick={() => handleSentenceClick(sent.index)}
                                      className={`h-7 text-[11px] font-medium rounded-md transition-all flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-blue-600 text-white shadow-xs font-bold'
                                          : isDone
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200/80 dark:border-slate-600'
                                      }`}
                                      title={sent.vietnamese}
                                    >
                                      {sent.index}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs text-slate-500 flex items-center justify-between">
          <span>Tổng: 50 Unit | 1500 câu</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Đã làm: {completedCount}
          </span>
        </div>
      </div>
    </div>
  );
};
