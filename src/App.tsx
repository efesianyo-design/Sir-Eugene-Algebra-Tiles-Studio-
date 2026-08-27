import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TileData, TileKind, TileSign, WorkspaceMode, GridConfig, ZeroPairCandidate, Challenge } from './types';
import { BASE_UNIT, X_UNIT, Y_UNIT, getTileDimensions, BUILT_IN_CHALLENGES } from './utils/constants';
import { organizeTilesInStandardOrder, findZeroPairs } from './utils/mathEngine';
import { playSound } from './utils/audio';

import { TopNavbar } from './components/TopNavbar';
import { TilePalette } from './components/TilePalette';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { ExpressionInspector } from './components/ExpressionInspector';
import { MobileBottomTray } from './components/MobileBottomTray';
import { PracticeChallenges } from './components/PracticeChallenges';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ActiveChallengeHUD } from './components/ActiveChallengeHUD';

export default function App() {
  // LocalStorage persistence key
  const STORAGE_KEY = 'algebra_tiles_workspace_v2';

  // Restore initial state from localStorage if available, or default to (x+1)(x+1) = x² + 2x + 1
  const [tiles, setTiles] = useState<TileData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.tiles) && parsed.tiles.length >= 0) {
          return parsed.tiles;
        }
      }
    } catch (e) {
      console.warn('Could not load saved workspace from localStorage', e);
    }
    return [
      { id: 't-init-1', kind: 'x2', sign: 1, x: 84, y: 84, rotation: 0, zone: 'main' }, // 148 x 148px
      { id: 't-init-2', kind: 'x', sign: 1, x: 232, y: 84, rotation: 90, zone: 'main' }, // 28 x 148px vertical
      { id: 't-init-3', kind: 'x', sign: 1, x: 84, y: 232, rotation: 0, zone: 'main' }, // 148 x 28px horizontal
      { id: 't-init-4', kind: 'unit', sign: 1, x: 232, y: 232, rotation: 0, zone: 'main' }, // 28 x 28px
    ];
  });

  // Undo / Redo history stack
  const [history, setHistory] = useState<TileData[][]>([tiles]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Workspace Mode
  const [mode, setMode] = useState<WorkspaceMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode === 'freeform' || parsed.mode === 'equation' || parsed.mode === 'factor') {
          return parsed.mode;
        }
      }
    } catch {}
    return 'freeform';
  });

  // Grid Configuration
  const [gridConfig, setGridConfig] = useState<GridConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gridConfig) {
          return {
            unitSize: BASE_UNIT,
            xSize: X_UNIT,
            ySize: Y_UNIT,
            snapToGrid: parsed.gridConfig.snapToGrid ?? true,
            showGrid: parsed.gridConfig.showGrid ?? true,
          };
        }
      }
    } catch {}
    return {
      unitSize: BASE_UNIT,
      xSize: X_UNIT,
      ySize: Y_UNIT,
      snapToGrid: true,
      showGrid: true,
    };
  });

  // Zero-pair auto-cancel
  const [autoCancelZeroPairs, setAutoCancelZeroPairs] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.autoCancelZeroPairs);
      }
    } catch {}
    return false;
  });

  // Auto-save canvas state to localStorage on changes
  useEffect(() => {
    try {
      const dataToSave = {
        tiles,
        mode,
        gridConfig: {
          snapToGrid: gridConfig.snapToGrid,
          showGrid: gridConfig.showGrid,
        },
        autoCancelZeroPairs,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('Auto-save to localStorage failed', err);
    }
  }, [tiles, mode, gridConfig.snapToGrid, gridConfig.showGrid, autoCancelZeroPairs]);

  // Modals
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Save history state on changes
  const recordHistory = useCallback(
    (newTiles: TileData[]) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newTiles];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      playSound('click');
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTiles(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      playSound('click');
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTiles(history[nextIndex]);
    }
  }, [history, historyIndex]);

  // Spawn a tile from the palette
  const handleSpawnTile = (kind: TileKind, sign: TileSign, rotation: 0 | 90 = 0) => {
    playSound('pickup');
    const id = `tile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dim = getTileDimensions(kind, rotation, gridConfig.unitSize, gridConfig.xSize, gridConfig.ySize);

    // Offset spawn slightly in center or staggered
    const spawnX = 120 + ((tiles.length * 24) % 180);
    const spawnY = 120 + ((tiles.length * 18) % 160);

    let zone: TileData['zone'] = 'main';
    if (mode === 'equation') {
      zone = spawnX < 400 ? 'left' : 'right';
    }

    const newTile: TileData = {
      id,
      kind,
      sign,
      x: spawnX,
      y: spawnY,
      rotation,
      zone,
    };

    const updated = [...tiles, newTile];
    setTiles(updated);
    recordHistory(updated);
  };

  // Quick Preset polynomials
  const handleQuickPreset = (preset: 'quad' | 'linear' | 'zeropair') => {
    playSound('pickup');
    let presetTiles: TileData[] = [];
    if (preset === 'quad') {
      // x² + 3x + 2
      presetTiles = [
        { id: `t-p-1`, kind: 'x2', sign: 1, x: 60, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-2`, kind: 'x', sign: 1, x: 180, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-3`, kind: 'x', sign: 1, x: 228, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-4`, kind: 'x', sign: 1, x: 276, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-5`, kind: 'unit', sign: 1, x: 324, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-6`, kind: 'unit', sign: 1, x: 372, y: 60, rotation: 0, zone: 'main' },
      ];
    } else if (preset === 'linear') {
      // 2x + 4
      presetTiles = [
        { id: `t-p-1`, kind: 'x', sign: 1, x: 60, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-2`, kind: 'x', sign: 1, x: 108, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-3`, kind: 'unit', sign: 1, x: 156, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-4`, kind: 'unit', sign: 1, x: 204, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-5`, kind: 'unit', sign: 1, x: 252, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-6`, kind: 'unit', sign: 1, x: 300, y: 60, rotation: 0, zone: 'main' },
      ];
    } else if (preset === 'zeropair') {
      // 3x - 2x + 2 - 2
      presetTiles = [
        { id: `t-p-1`, kind: 'x', sign: 1, x: 60, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-2`, kind: 'x', sign: 1, x: 108, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-3`, kind: 'x', sign: 1, x: 156, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-4`, kind: 'x', sign: -1, x: 156, y: 180, rotation: 0, zone: 'main' },
        { id: `t-p-5`, kind: 'x', sign: -1, x: 204, y: 180, rotation: 0, zone: 'main' },
        { id: `t-p-6`, kind: 'unit', sign: 1, x: 260, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-7`, kind: 'unit', sign: 1, x: 308, y: 60, rotation: 0, zone: 'main' },
        { id: `t-p-8`, kind: 'unit', sign: -1, x: 260, y: 110, rotation: 0, zone: 'main' },
        { id: `t-p-9`, kind: 'unit', sign: -1, x: 308, y: 110, rotation: 0, zone: 'main' },
      ];
    }
    setTiles(presetTiles);
    recordHistory(presetTiles);
  };

  // Cancel Single Zero Pair
  const handleCancelZeroPair = (pair: ZeroPairCandidate) => {
    playSound('zeropair');
    const updated = tiles.filter((t) => t.id !== pair.tile1Id && t.id !== pair.tile2Id);
    setTiles(updated);
    recordHistory(updated);
  };

  // Cancel All Detected Zero Pairs
  const handleCancelAllZeroPairs = () => {
    const pairs = findZeroPairs(tiles);
    if (pairs.length === 0) return;
    playSound('zeropair');

    const idsToRemove = new Set<string>();
    pairs.forEach((p) => {
      idsToRemove.add(p.tile1Id);
      idsToRemove.add(p.tile2Id);
    });

    const updated = tiles.filter((t) => !idsToRemove.has(t.id));
    setTiles(updated);
    recordHistory(updated);
  };

  // Neatly organize tiles in standard order
  const handleOrganizeStandardOrder = () => {
    playSound('snap');
    const organized = organizeTilesInStandardOrder(tiles, 50, 50, 640);
    setTiles(organized);
    recordHistory(organized);
  };

  // Clear workspace
  const handleClearCanvas = () => {
    playSound('clear');
    setTiles([]);
    recordHistory([]);
  };

  // Select a guided challenge
  const handleSelectChallenge = (challenge: Challenge) => {
    setActiveChallengeId(challenge.id);
    if (challenge.initialTiles) {
      const spawned: TileData[] = challenge.initialTiles.map((t, idx) => ({
        ...t,
        id: `ch-tile-${idx}-${Date.now()}`,
      }));
      setTiles(spawned);
      recordHistory(spawned);
    }
  };

  // Reset current challenge to its initial problem state
  const handleResetChallenge = () => {
    playSound('clear');
    const challenge = BUILT_IN_CHALLENGES.find((c) => c.id === activeChallengeId);
    if (challenge && challenge.initialTiles) {
      const spawned: TileData[] = challenge.initialTiles.map((t, idx) => ({
        ...t,
        id: `ch-tile-${idx}-${Date.now()}`,
      }));
      setTiles(spawned);
      recordHistory(spawned);
    } else {
      setTiles([]);
      recordHistory([]);
    }
  };

  // Advance to next challenge in curriculum
  const handleNextChallenge = () => {
    const currentIndex = BUILT_IN_CHALLENGES.findIndex((c) => c.id === activeChallengeId);
    if (currentIndex >= 0 && currentIndex < BUILT_IN_CHALLENGES.length - 1) {
      const nextChallenge = BUILT_IN_CHALLENGES[currentIndex + 1];
      if (nextChallenge.category === 'equations') {
        setMode('equation');
      } else if (nextChallenge.category === 'multiplication' || nextChallenge.category === 'factoring') {
        setMode('factor');
      } else {
        setMode('freeform');
      }
      handleSelectChallenge(nextChallenge);
    } else {
      setActiveChallengeId(null);
    }
  };

  const handleExitChallenge = () => {
    playSound('click');
    setActiveChallengeId(null);
  };

  const activeChallenge = BUILT_IN_CHALLENGES.find((c) => c.id === activeChallengeId);

  // Export workspace as image
  const handleExportPNG = () => {
    playSound('click');
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Algebra Tiles Studio', 40, 50);

    // Draw tiles
    tiles.forEach((t) => {
      const dim = getTileDimensions(t.kind, t.rotation, gridConfig.unitSize, gridConfig.xSize, gridConfig.ySize);
      ctx.fillStyle = t.sign > 0 ? '#10b981' : '#ef4444';
      if (t.kind === 'unit') ctx.fillStyle = t.sign > 0 ? '#eab308' : '#ef4444';
      if (t.kind === 'x2') ctx.fillStyle = t.sign > 0 ? '#059669' : '#dc2626';
      if (t.kind === 'y' || t.kind === 'y2') ctx.fillStyle = t.sign > 0 ? '#3b82f6' : '#dc2626';
      if (t.kind === 'xy') ctx.fillStyle = t.sign > 0 ? '#8b5cf6' : '#dc2626';

      ctx.fillRect(t.x + 40, t.y + 60, dim.width, dim.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x + 40, t.y + 60, dim.width, dim.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = (t.sign > 0 ? '+' : '-') + (t.kind === 'unit' ? '1' : t.kind);
      ctx.fillText(label, t.x + 40 + dim.width / 2, t.y + 60 + dim.height / 2);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `algebra-tiles-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans select-none touch-none" style={{ backgroundColor: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <TopNavbar
        mode={mode}
        onSetMode={setMode}
        gridConfig={gridConfig}
        onToggleGrid={() => setGridConfig((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
        onToggleSnap={() => setGridConfig((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenChallenges={() => setShowChallengesModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        onExportPNG={handleExportPNG}
      />

      {/* Main Responsive Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* On Desktop & Tablet: Left Sidebar Tile Bank */}
        <TilePalette
          className="hidden md:flex w-64 lg:w-72 flex-shrink-0 z-20"
          onSpawnTile={handleSpawnTile}
          onQuickPreset={handleQuickPreset}
        />

        {/* Center Interactive Math Canvas Viewport (On mobile: 70vh height) */}
        <div className="h-[70vh] md:h-auto md:flex-1 flex flex-col relative overflow-hidden flex-shrink-0">
          {activeChallenge && (
            <ActiveChallengeHUD
              challenge={activeChallenge}
              tiles={tiles}
              onResetChallenge={handleResetChallenge}
              onNextChallenge={handleNextChallenge}
              onExitChallenge={handleExitChallenge}
              onOpenChallengesModal={() => setShowChallengesModal(true)}
            />
          )}

          <WorkspaceCanvas
            tiles={tiles}
            mode={mode}
            gridConfig={gridConfig}
            setTiles={setTiles}
            onTilesChange={recordHistory}
            autoCancelZeroPairs={autoCancelZeroPairs}
            onCancelZeroPair={handleCancelZeroPair}
            onCancelAllZeroPairs={handleCancelAllZeroPairs}
          />
        </div>

        {/* On Desktop & Tablet: Right Sidebar Algebraic Expression Inspector */}
        <ExpressionInspector
          className="hidden md:flex w-72 lg:w-80 flex-shrink-0 z-20"
          tiles={tiles}
          mode={mode}
          autoCancelZeroPairs={autoCancelZeroPairs}
          onToggleAutoCancel={() => setAutoCancelZeroPairs(!autoCancelZeroPairs)}
          onCancelAllZeroPairs={handleCancelAllZeroPairs}
          onOrganizeStandardOrder={handleOrganizeStandardOrder}
          onClearCanvas={handleClearCanvas}
        />

        {/* On Mobile: Fixed bottom tile toolbox & live math ribbon */}
        <div className="md:hidden flex-1 flex flex-col bg-white border-t border-slate-200 overflow-hidden z-20">
          <MobileBottomTray
            tiles={tiles}
            mode={mode}
            onSpawnTile={handleSpawnTile}
            onCancelAllZeroPairs={handleCancelAllZeroPairs}
            onOrganizeStandardOrder={handleOrganizeStandardOrder}
            onClearCanvas={handleClearCanvas}
            onOpenChallenges={() => setShowChallengesModal(true)}
          />
        </div>
      </div>

      {/* Guided Challenges Modal */}
      {showChallengesModal && (
        <PracticeChallenges
          currentChallengeId={activeChallengeId}
          onSelectChallenge={handleSelectChallenge}
          onClose={() => setShowChallengesModal(false)}
          tiles={tiles}
          onSetWorkspaceMode={setMode}
        />
      )}

      {/* Help Guide Modal */}
      {showHelpModal && <HelpGuideModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
}
