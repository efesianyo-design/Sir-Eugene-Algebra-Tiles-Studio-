import React, { useState } from 'react';
import { WorkspaceMode, GridConfig } from '../types';
import {
  Layers,
  Scale,
  Grid,
  Magnet,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  HelpCircle,
  Trophy,
  Sparkles,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  PanelRightOpen,
  PanelRightClose,
  ShieldCheck,
} from 'lucide-react';
import { setSoundEnabled, getSoundEnabled, playSound } from '../utils/audio';
import { MathView } from './MathView';

interface TopNavbarProps {
  mode: WorkspaceMode;
  onSetMode: (mode: WorkspaceMode) => void;
  gridConfig: GridConfig;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenChallenges: () => void;
  onOpenHelp: () => void;
  onExportPNG: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  studentName?: string;
  studentAvatar?: string;
  studentLevel?: string;
  // Compact Live Math Summary
  mathSummary: {
    latex: string;
    isBalanced?: boolean;
    isValidProduct?: boolean;
    label: string;
  };
  // Inspector toggle
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  // Question bar collapsed state
  isQuestionBarOpen: boolean;
  onToggleQuestionBar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode,
  onSetMode,
  gridConfig,
  onToggleGrid,
  onToggleSnap,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenChallenges,
  onOpenHelp,
  onExportPNG,
  onOpenProfile,
  onOpenAdmin,
  studentName,
  studentAvatar,
  studentLevel,
  mathSummary,
  isInspectorOpen,
  onToggleInspector,
  isQuestionBarOpen,
  onToggleQuestionBar,
}) => {
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [copied, setCopied] = useState(false);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) playSound('click');
  };

  const handleCopyMath = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    navigator.clipboard.writeText(mathSummary.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header
      id="top-navbar"
      className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 z-40 flex-shrink-0 select-none shadow-sm gap-2 sm:gap-3 w-full"
    >
      {/* Left: Brand & Mode Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md ring-1 ring-white/10">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-xs sm:text-sm tracking-tight text-slate-100 leading-tight">
              Algebra Tiles <span className="text-cyan-400 font-extrabold">Studio</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium leading-none">
              Sir Eugene Technologies
            </span>
          </div>
        </div>

        {/* Mode Tabs (No gap artifacts) */}
        <nav
          id="primary-mode-nav-tabs"
          aria-label="Workspace Modes"
          className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 shadow-inner"
        >
          <button
            id="nav-mode-equation-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onSetMode('equation');
            }}
            className={`min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'equation'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Equation Mat</span>
          </button>

          <button
            id="nav-mode-factor-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onSetMode('factor');
            }}
            className={`min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'factor'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Factoring Grid</span>
          </button>

          <button
            id="nav-mode-freeform-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onSetMode('freeform');
            }}
            className={`min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'freeform'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Free Explore</span>
          </button>
        </nav>
      </div>

      {/* Center: Live Math Summary */}
      <div
        id="nav-live-math-summary"
        onClick={handleCopyMath}
        className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer shadow-inner max-w-sm truncate"
      >
        <span className="text-[10px] font-black uppercase text-slate-400">
          {mathSummary.label}:
        </span>
        <div className="text-xs sm:text-sm font-bold text-cyan-300 truncate font-mono">
          <MathView latex={mathSummary.latex || '0'} />
        </div>
      </div>

      {/* Right: Controls & Student Profile */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          id="nav-student-profile-btn"
          type="button"
          onClick={() => {
            playSound('click');
            onOpenProfile();
          }}
          className="min-h-[34px] flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
        >
          <span className="text-sm">{studentAvatar || '🧠'}</span>
          <span className="max-w-[90px] truncate">{studentName || 'Student'}</span>
        </button>

        <button
          id="nav-admin-portal-btn"
          type="button"
          onClick={() => {
            playSound('click');
            onOpenAdmin();
          }}
          className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Admin</span>
        </button>

        <button
          id="nav-toggle-question-bar-btn"
          type="button"
          onClick={onToggleQuestionBar}
          className={`min-h-[34px] flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer ${
            isQuestionBarOpen
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Puzzles Modal */}
        <button
          onClick={() => {
            playSound('click');
            onOpenChallenges();
          }}
          className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Puzzles</span>
        </button>

        {/* Inspector Toggle */}
        <button
          onClick={onToggleInspector}
          className={`min-h-[34px] p-1.5 rounded-lg border text-xs font-bold ${
            isInspectorOpen
              ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Inspect"
        >
          {isInspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
        </button>

        {/* Help Modal */}
        <button
          onClick={() => {
            playSound('click');
            onOpenHelp();
          }}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
