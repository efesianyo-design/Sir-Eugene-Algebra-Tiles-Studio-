import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { setSoundEnabled, getSoundEnabled, playSound } from '../utils/audio';

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
}) => {
  const [soundOn, setSoundOn] = useState(getSoundEnabled());
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) playSound('click');
  };

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredInstallPrompt(null);
    } else {
      alert('To install this app on your device:\n• iOS/iPadOS Safari: Tap Share -> "Add to Home Screen"\n• Chrome/Edge/Android: Tap browser menu -> "Install App"');
    }
  };

  return (
    <header
      id="top-navbar"
      className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-5 select-none z-40 relative flex-shrink-0"
    >
      {/* Brand & Mode Switchers */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto py-1">
        {/* App Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-extrabold text-sm text-slate-100 tracking-tight leading-tight">
              Algebra Tiles <span className="text-cyan-400 font-semibold">Studio</span>
            </h1>
            <span className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 whitespace-nowrap">
              Sir Eugene Technologies
            </span>
          </div>
        </div>

        {/* Workspace Mode Switcher Toolbar */}
        <div
          id="mode-switcher-toolbar"
          className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800 gap-1 flex-shrink-0 shadow-sm"
        >
          {/* 1. Free Explore Mode */}
          <button
            id="nav-mode-freeform-btn"
            type="button"
            title="Free Explore Mode: Blank canvas for building expressions and simplifying terms"
            className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              mode === 'freeform'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('freeform');
            }}
          >
            <Layers className="w-4 h-4" />
            <span>Free Explore</span>
          </button>

          {/* 2. Equation Mat Mode */}
          <button
            id="nav-mode-equation-btn"
            type="button"
            title="Equation Mat Mode: Split canvas with vertical divider and '=' symbol to solve and balance equations"
            className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              mode === 'equation'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('equation');
            }}
          >
            <Scale className="w-4 h-4" />
            <span>Equation Mat</span>
          </button>

          {/* 3. Factoring / Area Multiplication Grid */}
          <button
            id="nav-mode-factor-btn"
            type="button"
            title="Factoring / Area Multiplication Grid: L-shaped factor margins framing inner product rectangle"
            className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              mode === 'factor'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            onClick={() => {
              playSound('click');
              onSetMode('factor');
            }}
          >
            <Grid className="w-4 h-4" />
            <span>Factoring Grid</span>
          </button>
        </div>

        {/* Challenges CTA Button */}
        <button
          id="nav-challenges-modal-btn"
          type="button"
          className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('click');
            onOpenChallenges();
          }}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Practice Puzzles</span>
        </button>
      </div>

      {/* Right Controls: Undo/Redo, Snapping, Sound, Help, Export, PWA */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-0.5">
          <button
            id="nav-undo-btn"
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-lg transition-colors flex items-center justify-center ${
              canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            onClick={onUndo}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            id="nav-redo-btn"
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-lg transition-colors flex items-center justify-center ${
              canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95' : 'text-slate-600 cursor-not-allowed'
            }`}
            onClick={onRedo}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Snap to Grid Toggle */}
        <button
          id="nav-toggle-snap-btn"
          type="button"
          title={`Snap to Grid: ${gridConfig.snapToGrid ? 'ON' : 'OFF'}`}
          className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition-colors flex items-center justify-center active:scale-95 ${
            gridConfig.snapToGrid
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          onClick={onToggleSnap}
        >
          <Magnet className="w-4 h-4" />
        </button>

        {/* Grid Visibility Toggle */}
        <button
          id="nav-toggle-grid-btn"
          type="button"
          title={`Grid Lines: ${gridConfig.showGrid ? 'ON' : 'OFF'}`}
          className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition-colors flex items-center justify-center active:scale-95 ${
            gridConfig.showGrid
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          onClick={onToggleGrid}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          id="nav-toggle-sound-btn"
          type="button"
          title={`Sound Effects: ${soundOn ? 'ON' : 'MUTED'}`}
          className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition-colors flex items-center justify-center active:scale-95 ${
            soundOn
              ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-slate-950/60 border-slate-800 text-slate-600'
          }`}
          onClick={toggleSound}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Export Canvas Image */}
        <button
          id="nav-export-png-btn"
          type="button"
          title="Export Workspace as Image / LaTeX"
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center active:scale-95"
          onClick={onExportPNG}
        >
          <Download className="w-4 h-4" />
        </button>

        {/* PWA Standalone / Offline Badge */}
        <div
          title={isOnline ? 'Online (Cached for Offline Use)' : 'Offline Mode (PWA)'}
          className={`hidden md:flex min-h-[44px] items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border font-bold ${
            isOnline
              ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-400'
              : 'bg-amber-950/40 border-amber-600/40 text-amber-400'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? 'Offline-Ready' : 'Offline'}</span>
        </div>

        {/* Install App Button */}
        {!isAppInstalled && (
          <button
            id="nav-install-pwa-btn"
            type="button"
            title="Install App (PWA)"
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            onClick={handleInstallClick}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Help Guide */}
        <button
          id="nav-help-guide-btn"
          type="button"
          title="How to Use & Algebra Guide"
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center justify-center active:scale-95"
          onClick={onOpenHelp}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
