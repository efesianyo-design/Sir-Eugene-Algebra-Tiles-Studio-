import React, { useState, useEffect } from 'react';
import { WorkspaceMode } from '../types';
import { playSound } from '../utils/audio';
import {
  Sparkles,
  Hand,
  ChevronDown,
  X,
  ChevronUp,
} from 'lucide-react';

interface CustomQuestionBarProps {
  mode: WorkspaceMode;
  onAutoLoadQuestion: (questionStr: string, mode: WorkspaceMode) => void;
  onSelfPlaceQuestion: (questionStr: string, mode: WorkspaceMode) => void;
  activeTargetQuestion: string | null;
  onClearActiveQuestion: () => void;
  isOpen: boolean;
  onClose: () => void;
  studentGrade?: string;
}

export interface CurriculumPresetItem {
  label: string;
  value: string;
  form: 'Form 1' | 'Form 2' | 'Form 3';
  topic: string;
  badge?: string;
}

const CURRICULUM_PRESETS: Record<WorkspaceMode, CurriculumPresetItem[]> = {
  equation: [
    // Form 1: Linear Equations & Introductory Algebra
    { form: 'Form 1', topic: 'Linear Equations (One-Step & Two-Step)', label: '2x + 3 = 7', value: '2x + 3 = 7', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Linear Equations (One-Step & Two-Step)', label: 'x + 5 = 9', value: 'x + 5 = 9', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Linear Equations (One-Step & Two-Step)', label: '3x - 4 = 5', value: '3x - 4 = 5', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Linear Equations (One-Step & Two-Step)', label: '2x + 6 = 12', value: '2x + 6 = 12', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Variables on Both Sides', label: '4x - 2 = 2x + 6', value: '4x - 2 = 2x + 6', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Variables on Both Sides', label: '3x - 4 = x + 2', value: '3x - 4 = x + 2', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Variables on Both Sides', label: '3x + 1 = x + 7', value: '3x + 1 = x + 7', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Variables on Both Sides', label: '2x - 3 = 5', value: '2x - 3 = 5', badge: 'Form 1' },

    // Form 2: Multi-Step & Quadratic Equations
    { form: 'Form 2', topic: 'Multi-Step Linear Equations', label: '5x + 3 = 2x + 12', value: '5x + 3 = 2x + 12', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Multi-Step Linear Equations', label: '3x + 6 = 2x + 10', value: '3x + 6 = 2x + 10', badge: 'Form 2' },

    // Form 3: Quadratic & Advanced Equations
    { form: 'Form 3', topic: 'Advanced Equations', label: 'x^2 + 5x + 6 = 0', value: 'x^2 + 5x + 6 = 0', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Difference of Squares Equations', label: 'x^2 - 4 = 0', value: 'x^2 - 4 = 0', badge: 'Form 3' },
  ],
  factor: [
    // Form 2: Quadratic Expansions & Trinomial Factoring with Positive Terms
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 5x + 6', value: 'x^2 + 5x + 6', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 4x + 3', value: 'x^2 + 4x + 3', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 7x + 12', value: 'x^2 + 7x + 12', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 6x + 8', value: 'x^2 + 6x + 8', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 7x + 10', value: 'x^2 + 7x + 10', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Positive Trinomials (x² + bx + c)', label: 'x² + 8x + 12', value: 'x^2 + 8x + 12', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Non-Monic Trinomials (ax² + bx + c)', label: '2x² + 5x + 2', value: '2x^2 + 5x + 2', badge: 'Form 2' },

    // Form 3: Quadratics with Mixed Signs & Difference of Two Squares
    { form: 'Form 3', topic: 'Difference of Two Squares (x² - a²)', label: 'x² - 4', value: 'x^2 - 4', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Difference of Two Squares (x² - a²)', label: 'x² - 9', value: 'x^2 - 9', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Mixed Signs Trinomials', label: 'x² + x - 6', value: 'x^2 + x - 6', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Mixed Signs Trinomials', label: 'x² - 5x + 6', value: 'x^2 - 5x + 6', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Mixed Signs Trinomials', label: 'x² - 2x - 8', value: 'x^2 - 2x - 8', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Mixed Signs Trinomials', label: 'x² - 3x - 4', value: 'x^2 - 3x - 4', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Advanced Non-Monic Quadratics', label: '2x² + 3x - 2', value: '2x^2 + 3x - 2', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Advanced Non-Monic Quadratics', label: '2x² - 5x + 2', value: '2x^2 - 5x + 2', badge: 'Form 3' },
  ],
  freeform: [
    // Form 1: Linear Expressions & Combining Like Terms
    { form: 'Form 1', topic: 'Introductory Algebra & Combining Terms', label: '3x + 4 - 2x + 1', value: '3x + 4 - 2x + 1', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Introductory Algebra & Combining Terms', label: '2x + 3y - x - 2y + 1', value: '2x + 3y - x - 2y + 1', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Introductory Algebra & Combining Terms', label: '4x - 3 + 2x - 5', value: '4x - 3 + 2x - 5', badge: 'Form 1' },
    { form: 'Form 1', topic: 'Introductory Algebra & Combining Terms', label: '5x + 2 - 3x + 4', value: '5x + 2 - 3x + 4', badge: 'Form 1' },

    // Form 2: Quadratic Expansions
    { form: 'Form 2', topic: 'Quadratic Polynomial Expansions', label: '2x² - x² + 3x - 4', value: '2x^2 - x^2 + 3x - 4', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Quadratic Polynomial Expansions', label: 'x² + 3x + 2x + 6', value: 'x^2 + 3x + 2x + 6', badge: 'Form 2' },
    { form: 'Form 2', topic: 'Quadratic Polynomial Expansions', label: '2x² + 4x + x + 2', value: '2x^2 + 4x + x + 2', badge: 'Form 2' },

    // Form 3: Mixed Signs & Complex Expansions
    { form: 'Form 3', topic: 'Advanced Expansions & Zero Pairs', label: 'x² + 3x - 2x - 6', value: 'x^2 + 3x - 2x - 6', badge: 'Form 3' },
    { form: 'Form 3', topic: 'Advanced Expansions & Zero Pairs', label: '2x² - 4x + x - 2', value: '2x^2 - 4x + x - 2', badge: 'Form 3' },
  ],
  challenges: [],
};

export const CustomQuestionBar: React.FC<CustomQuestionBarProps> = ({
  mode,
  onAutoLoadQuestion,
  onSelfPlaceQuestion,
  activeTargetQuestion,
  onClearActiveQuestion,
  isOpen,
  onClose,
  studentGrade,
}) => {
  const [inputText, setInputText] = useState(
    mode === 'equation' ? '2x + 3 = 7' : mode === 'factor' ? 'x^2 + 5x + 6' : '3x + 4 - 2x + 1'
  );
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [selectedFormFilter, setSelectedFormFilter] = useState<'All' | 'Form 1' | 'Form 2' | 'Form 3'>('All');

  useEffect(() => {
    if (studentGrade === 'Form 1' || studentGrade === 'Form 2' || studentGrade === 'Form 3') {
      setSelectedFormFilter(studentGrade);
    }
  }, [studentGrade]);

  useEffect(() => {
    if (!activeTargetQuestion) {
      if (mode === 'equation') setInputText('2x + 3 = 7');
      else if (mode === 'factor') setInputText('x^2 + 5x + 6');
      else if (mode === 'freeform') setInputText('3x + 4 - 2x + 1');
    }
  }, [mode, activeTargetQuestion]);

  if (!isOpen) return null;

  const handleAutoLoad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    playSound('pickup');
    onAutoLoadQuestion(inputText.trim(), mode);
  };

  const handleSelfPlace = () => {
    if (!inputText.trim()) return;
    playSound('click');
    onSelfPlaceQuestion(inputText.trim(), mode);
  };

  const handleSelectPreset = (val: string) => {
    playSound('click');
    setInputText(val);
    setShowPresetsDropdown(false);
    onAutoLoadQuestion(val, mode);
  };

  const allPresets = CURRICULUM_PRESETS[mode] || [];
  const filteredPresets = selectedFormFilter === 'All'
    ? allPresets
    : allPresets.filter((p) => p.form === selectedFormFilter);

  // Group presets by topic
  const groupedPresets: Record<string, CurriculumPresetItem[]> = {};
  filteredPresets.forEach((p) => {
    if (!groupedPresets[p.topic]) {
      groupedPresets[p.topic] = [];
    }
    groupedPresets[p.topic].push(p);
  });

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPresetsDropdown(false);
      }
    };
    if (showPresetsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresetsDropdown]);

  return (
    <div
      id="custom-question-compact-bar"
      className="bg-slate-900/98 border-b border-slate-800 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2 z-40 shadow-md flex-shrink-0 w-full relative"
    >
      <form onSubmit={handleAutoLoad} className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-4xl flex-wrap sm:flex-nowrap">
        {/* Input Field: e.g. "2x + 3 = 7" */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
          <input
            id="custom-question-text-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'equation'
                ? 'e.g. 2x + 3 = 7'
                : mode === 'factor'
                ? 'e.g. x^2 + 5x + 6'
                : 'e.g. 3x + 4 - 2x + 1'
            }
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 font-mono text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-700/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all shadow-inner"
          />
          {activeTargetQuestion && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-600/40 px-1.5 py-0.5 rounded font-semibold">
              <span className="truncate max-w-[90px] sm:max-w-[180px]">{activeTargetQuestion}</span>
              <button
                type="button"
                onClick={onClearActiveQuestion}
                className="hover:text-red-400 font-bold ml-0.5"
                title="Clear problem"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 🪄 Auto-Load */}
        <button
          id="btn-auto-load-tiles"
          type="submit"
          className="min-h-[34px] flex items-center justify-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex-shrink-0 whitespace-nowrap"
          title="Automatically populate tile bank for this expression"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Load</span>
        </button>

        {/* ✍️ Place Tiles */}
        <button
          id="btn-place-tiles-myself"
          type="button"
          onClick={handleSelfPlace}
          className="min-h-[34px] flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs rounded-lg shadow-sm transition-all flex-shrink-0 whitespace-nowrap"
          title="Start with a blank canvas and place your own manipulative tiles"
        >
          <Hand className="w-3.5 h-3.5 text-amber-400" />
          <span>Place Tiles</span>
        </button>

        {/* Quick Curriculum Presets Dropdown ▾ */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            id="btn-quick-presets-dropdown"
            type="button"
            onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
            className="min-h-[34px] flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
          >
            <span>Curriculum Presets</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showPresetsDropdown ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          {showPresetsDropdown && (
            <div
              id="presets-dropdown-menu"
              className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header Title */}
              <div className="px-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                    Curriculum Problem Bank
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sir Eugene SHS Mathematics
                  </span>
                </div>
                {studentGrade && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-1.5 py-0.5 rounded font-bold">
                    {studentGrade}
                  </span>
                )}
              </div>

              {/* Form Filter Tabs */}
              <div className="px-2 pt-2 pb-1.5 flex items-center gap-1 bg-slate-950/40 border-b border-slate-800/80">
                {(['All', 'Form 1', 'Form 2', 'Form 3'] as const).map((formTab) => (
                  <button
                    key={formTab}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setSelectedFormFilter(formTab);
                    }}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded-md transition-all ${
                      selectedFormFilter === formTab
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {formTab}
                  </button>
                ))}
              </div>

              {/* Problem List by Topic */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50">
                {Object.keys(groupedPresets).length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No presets found for this filter.
                  </div>
                ) : (
                  Object.entries(groupedPresets).map(([topic, items]) => (
                    <div key={topic} className="py-1">
                      <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/20">
                        {topic}
                      </div>
                      {items.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleSelectPreset(preset.value)}
                          className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-cyan-950/70 hover:text-cyan-300 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 group-hover:text-cyan-200">
                              {preset.label}
                            </span>
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                                preset.form === 'Form 1'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                  : preset.form === 'Form 2'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                                  : 'bg-purple-950 text-purple-300 border border-purple-800/40'
                              }`}
                            >
                              {preset.form}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">Load →</span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Close/Hide Button */}
      <button
        id="btn-close-question-bar"
        type="button"
        onClick={onClose}
        title="Hide Question Bar"
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
