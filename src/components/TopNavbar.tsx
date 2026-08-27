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
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { setSoundEnabled, getSoundEnabled, playSound } from '../utils/audio';
import { MathView } from './MathView';
import { ExpressionBreakdown } from '../types';

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
      className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-4 z-40 flex-shrink-0 select-none shadow-sm gap-2"
    >
      {/* Brand & Single Mode Selector */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0 ring-1 ring-white/10">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-xs sm:text-sm tracking-tight text-slate-100 leading-tight">
              Algebra Tiles <span className="text-cyan-400 font-extrabold">Studio</span>
            </h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight leading-none">
              Sir Eugene Technologies
            </span>
          </div>
        </div>

        {/* 1. Consolidated Single Top Navigation Mode Selector: [ ⚖️ Equation Mat ] | [ 🔲 Factoring Grid ] | [ ✏️ Free Explore ] */}
        <nav
          id="primary-mode-nav-tabs"
          aria-label="Workspace Modes"
          className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 gap-0.5 sm:gap-1 shadow-inner"
        >
          {/* Equation Mat */}
          <button
            id="nav-mode-equation-btn"
            type="button"
            className={`min-h-[36px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'equation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('equation');
            }}
            title="Solve linear equations step-by-step with balanced left & right mats"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Equation Mat</span>
            <span className="sm:hidden">Equation</span>
          </button>

          {/* Factoring Grid */}
          <button
            id="nav-mode-factor-btn"
            type="button"
            className={`min-h-[36px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'factor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('factor');
            }}
            title="Factoring & Area multiplication grid"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Factoring Grid</span>
            <span className="sm:hidden">Factoring</span>
          </button>

          {/* Free Explore */}
          <button
            id="nav-mode-freeform-btn"
            type="button"
            className={`min-h-[36px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === 'freeform'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('freeform');
            }}
            title="Freeform expressions & simplifying like terms"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Free Explore</span>
            <span className="sm:hidden">Explore</span>
          </button>
        </nav>
      </div>

      {/* 2. Embedded Compact Live Math Readout (Eliminates floating white card on canvas) */}
      <div
        id="topbar-live-math-badge"
        onClick={handleCopyMath}
        className="hidden md:flex items-center gap-2 bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 px-3 py-1 rounded-xl shadow-inner cursor-pointer transition-all max-w-[200px] lg:max-w-xs xl:max-w-md truncate"
        title="Click to copy LaTeX expression"
      >
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 hidden md:inline">
          {mathSummary.label}:
        </span>
        <div className="text-xs sm:text-sm font-bold text-cyan-300 truncate font-mono">
          <MathView latex={mathSummary.latex || '0'} />
        </div>
        {mathSummary.isBalanced && (
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold hidden sm:inline-flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Balanced
          </span>
        )}
        {mathSummary.isValidProduct && (
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold hidden sm:inline-flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Valid
          </span>
        )}
        <span className="text-slate-500 hover:text-slate-300 ml-auto hidden sm:inline">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </span>
      </div>

      {/* Right Controls: Question Toggle, Undo/Redo, Snap/Grid/Sound, Challenges, Help */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Toggle Question Input Bar (Collapse to maximize canvas) */}
        <button
          id="nav-toggle-question-bar-btn"
          type="button"
          onClick={onToggleQuestionBar}
          className={`min-h-[36px] flex items-center gap-1 px-2 sm:px-2.5 rounded-lg border text-xs font-bold transition-all ${
            isQuestionBarOpen
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={isQuestionBarOpen ? 'Hide Question Input Bar' : 'Show Question Input Bar'}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Problem</span>
          {isQuestionBarOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            id="nav-undo-btn"
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            className={`min-h-[32px] min-w-[32px] p-1.5 rounded transition-colors flex items-center justify-center ${
              canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            onClick={onUndo}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="nav-redo-btn"
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            className={`min-h-[32px] min-w-[32px] p-1.5 rounded transition-colors flex items-center justify-center ${
              canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            onClick={onRedo}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snapping Toggle */}
        <button
          id="nav-toggle-snap-btn"
          type="button"
          title={`Snap to Grid: ${gridConfig.snapToGrid ? 'ON' : 'OFF'}`}
          className={`min-h-[34px] min-w-[34px] p-1.5 rounded-lg border transition-colors flex items-center justify-center active:scale-95 ${
            gridConfig.snapToGrid
              ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          onClick={onToggleSnap}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        {/* Practice Puzzles CTA */}
        <button
          id="nav-challenges-modal-btn"
          type="button"
          className="min-h-[34px] flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shadow-sm"
          onClick={() => {
            playSound('click');
            onOpenChallenges();
          }}
          title="Practice challenges & guided algebra puzzles"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Puzzles</span>
        </button>

        {/* Toggle Right Inspector Drawer (Desktop) */}
        <button
          id="nav-toggle-inspector-btn"
          type="button"
          title={isInspectorOpen ? 'Collapse Math Inspector' : 'Expand Math Inspector'}
          className={`hidden md:flex min-h-[34px] min-w-[34px] p-1.5 rounded-lg border transition-colors items-center justify-center active:scale-95 ${
            isInspectorOpen
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          onClick={onToggleInspector}
        >
          {isInspectorOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
        </button>

        {/* Sound Toggle */}
        <button
          id="nav-toggle-sound-btn"
          type="button"
          title={`Sound Effects: ${soundOn ? 'ON' : 'MUTED'}`}
          className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center active:scale-95"
          onClick={toggleSound}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5 text-slate-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
        </button>

        {/* Help Guide */}
        <button
          id="nav-help-guide-btn"
          type="button"
          title="How to Use & Algebra Tiles Guide"
          className="min-h-[34px] min-w-[34px] p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center justify-center active:scale-95"
          onClick={onOpenHelp}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
