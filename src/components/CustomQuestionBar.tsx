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
}

const PRESET_SETS: Record<WorkspaceMode, { label: string; value: string }[]> = {
  equation: [
    { label: '2x + 3 = 7', value: '2x + 3 = 7' },
    { label: '3x - 4 = x + 2', value: '3x - 4 = x + 2' },
    { label: '2x + 6 = 12', value: '2x + 6 = 12' },
    { label: '4x - 2 = 2x + 6', value: '4x - 2 = 2x + 6' },
    { label: 'x + 5 = 9', value: 'x + 5 = 9' },
    { label: '2x - 3 = 5', value: '2x - 3 = 5' },
  ],
  factor: [
    { label: 'x² + 5x + 6', value: 'x^2 + 5x + 6' },
    { label: 'x² + 7x + 12', value: 'x^2 + 7x + 12' },
    { label: 'x² + 4x + 3', value: 'x^2 + 4x + 3' },
    { label: '2x² + 5x + 2', value: '2x^2 + 5x + 2' },
    { label: 'x² - 4', value: 'x^2 - 4' },
    { label: 'x² - 3x - 4', value: 'x^2 - 3x - 4' },
  ],
  freeform: [
    { label: '3x + 4 - 2x + 1', value: '3x + 4 - 2x + 1' },
    { label: '2x² - x² + 3x - 4', value: '2x^2 - x^2 + 3x - 4' },
    { label: '2x + 3y - x - 2y + 1', value: '2x + 3y - x - 2y + 1' },
    { label: '4x - 3 + 2x - 5', value: '4x - 3 + 2x - 5' },
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
}) => {
  const [inputText, setInputText] = useState(
    mode === 'equation' ? '2x + 3 = 7' : mode === 'factor' ? 'x^2 + 5x + 6' : '3x + 4 - 2x + 1'
  );
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

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

  const presets = PRESET_SETS[mode] || [];

  return (
    <div
      id="custom-question-compact-bar"
      className="bg-slate-900/98 border-b border-slate-800 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-2 z-30 shadow-md flex-shrink-0 w-full overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap"
    >
      <form onSubmit={handleAutoLoad} className="flex items-center gap-1.5 sm:gap-2 flex-1 max-w-4xl flex-shrink-0">
        {/* Input Field: e.g. "2x + 3 = 7" */}
        <div className="relative flex-1 min-w-[140px] sm:min-w-[180px] flex-shrink-0">
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
          title="Automatically spawn and position tiles matching this problem"
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

        {/* Quick Presets Dropdown ▾ */}
        <div className="relative flex-shrink-0">
          <button
            id="btn-quick-presets-dropdown"
            type="button"
            onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
            className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all whitespace-nowrap"
          >
            <span>Presets</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showPresetsDropdown && (
            <div
              className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
              onMouseLeave={() => setShowPresetsDropdown(false)}
            >
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                Sample Problems
              </div>
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-cyan-950 hover:text-cyan-300 transition-colors flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
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
