import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TileData, TileKind, TileSign, WorkspaceMode, GridConfig, ZeroPairCandidate, Challenge } from './types';
import { BASE_UNIT, X_UNIT, Y_UNIT, getTileDimensions, BUILT_IN_CHALLENGES } from './utils/constants';
import { organizeTilesInStandardOrder, findZeroPairs, computeExpressionBreakdown } from './utils/mathEngine';
import { playSound } from './utils/audio';
import confetti from 'canvas-confetti';

import {
  parseEquationString,
  generateTilesFromEquation,
  generateTilesForFactoring,
  parsePolynomialString,
  autoArrangeFactoredRectangle,
  groupConstantsByXRows,
  FactoringAnalysis,
} from './utils/mathParser';
import { computeFactoringModel } from './utils/mathEngine';

import { TopNavbar } from './components/TopNavbar';
import { CustomQuestionBar } from './components/CustomQuestionBar';
import { EquationStepToolbar, EquationStep } from './components/EquationStepToolbar';
import { SocraticCoachBar } from './components/SocraticCoachBar';
import { SlimTileToolbox } from './components/SlimTileToolbox';
import { WorkspaceCanvas } from './components/WorkspaceCanvas';
import { ExpressionInspector } from './components/ExpressionInspector';
import { PracticeChallenges } from './components/PracticeChallenges';
import { HelpGuideModal } from './components/HelpGuideModal';
import { ActiveChallengeHUD } from './components/ActiveChallengeHUD';

export default function App() {
  const STORAGE_KEY = 'algebra_tiles_workspace_v4';

  // Initial state
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
      { id: 't-init-1', kind: 'x2', sign: 1, x: 100, y: 100, rotation: 0, zone: 'main' },
      { id: 't-init-2', kind: 'x', sign: 1, x: 260, y: 100, rotation: 90, zone: 'main' },
      { id: 't-init-3', kind: 'x', sign: 1, x: 100, y: 260, rotation: 0, zone: 'main' },
      { id: 't-init-4', kind: 'unit', sign: 1, x: 260, y: 260, rotation: 0, zone: 'main' },
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
    return 'equation';
  });

  // UI state: Collapsible Question Bar & Inspector Drawer
  const [isQuestionBarOpen, setIsQuestionBarOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Custom Target Question state
  const [activeTargetQuestion, setActiveTargetQuestion] = useState<string | null>('2x + 3 = 7');
  const [activeFactoringAnalysis, setActiveFactoringAnalysis] = useState<FactoringAnalysis | null>(null);

  // Equation Steps Log
  const [equationSteps, setEquationSteps] = useState<EquationStep[]>([
    {
      description: 'Original: 2x + 3 = 7',
      leftLatex: '2x + 3',
      rightLatex: '7',
    },
  ]);

  // Grid Configuration
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    unitSize: BASE_UNIT,
    xSize: X_UNIT,
    ySize: Y_UNIT,
    snapToGrid: true,
    showGrid: true,
  });

  // Zero-pair auto-cancel
  const [autoCancelZeroPairs, setAutoCancelZeroPairs] = useState<boolean>(false);

  // Modals
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Auto-save canvas state to localStorage
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
        activeTargetQuestion,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn('Auto-save to localStorage failed', err);
    }
  }, [tiles, mode, gridConfig.snapToGrid, gridConfig.showGrid, autoCancelZeroPairs, activeTargetQuestion]);

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

  // Handle Auto-Loading Custom Questions
  const handleAutoLoadQuestion = (questionStr: string, targetMode: WorkspaceMode) => {
    playSound('pickup');
    setActiveTargetQuestion(questionStr);

    if (targetMode === 'equation') {
      const parsed = parseEquationString(questionStr);
      const generated = generateTilesFromEquation(parsed, 800, 100);
      setTiles(generated);
      recordHistory(generated);

      const leftBreakdown = computeExpressionBreakdown(generated.filter((t) => t.zone === 'left'));
      const rightBreakdown = computeExpressionBreakdown(generated.filter((t) => t.zone === 'right'));

      setEquationSteps([
        {
          description: `Loaded: ${questionStr}`,
          leftLatex: leftBreakdown.simplifiedLatex || '0',
          rightLatex: rightBreakdown.simplifiedLatex || '0',
        },
      ]);
      setActiveFactoringAnalysis(null);
    } else if (targetMode === 'factor') {
      const { tiles: factorTiles, analysis } = generateTilesForFactoring(questionStr, 220, 220);
      setTiles(factorTiles);
      recordHistory(factorTiles);
      setActiveFactoringAnalysis(analysis);
    } else {
      // Freeform / Simplify expression
      const parsed = parsePolynomialString(questionStr);
      const simpTiles: TileData[] = [];
      let curX = 80;
      let curY = 100;
      parsed.terms.forEach((term, tIdx) => {
        for (let i = 0; i < term.count; i++) {
          const dim = getTileDimensions(term.kind, 0);
          simpTiles.push({
            id: `simp-${tIdx}-${i}-${Date.now()}`,
            kind: term.kind,
            sign: term.sign,
            x: curX,
            y: curY,
            rotation: 0,
            zone: 'main',
          });
          curX += dim.width + 12;
          if (curX > 600) {
            curX = 80;
            curY += 70;
          }
        }
      });
      setTiles(simpTiles);
      recordHistory(simpTiles);
      setActiveFactoringAnalysis(null);
    }
  };

  // Student will place tiles themselves
  const handleSelfPlaceQuestion = (questionStr: string, targetMode: WorkspaceMode) => {
    playSound('click');
    setActiveTargetQuestion(questionStr);
    setTiles([]);
    recordHistory([]);

    if (targetMode === 'equation') {
      setEquationSteps([
        {
          description: `Target: ${questionStr}`,
          leftLatex: '?',
          rightLatex: '?',
        },
      ]);
      setActiveFactoringAnalysis(null);
    } else if (targetMode === 'factor') {
      const { analysis } = generateTilesForFactoring(questionStr);
      setActiveFactoringAnalysis(analysis);
    } else {
      setActiveFactoringAnalysis(null);
    }
  };

  // Add identical tiles to BOTH sides of the equation balance mat
  const handleAddBothSides = (kind: TileKind, sign: TileSign, count: number = 1) => {
    playSound('pickup');
    const newTiles = [...tiles];

    for (let i = 0; i < count; i++) {
      // Spawn on left
      newTiles.push({
        id: `both-left-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        kind,
        sign,
        x: 80 + ((newTiles.length * 28) % 180),
        y: 260 + ((newTiles.length * 20) % 140),
        rotation: 0,
        zone: 'left',
      });
      // Spawn on right
      newTiles.push({
        id: `both-right-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        kind,
        sign,
        x: 460 + ((newTiles.length * 28) % 180),
        y: 260 + ((newTiles.length * 20) % 140),
        rotation: 0,
        zone: 'right',
      });
    }

    setTiles(newTiles);
    recordHistory(newTiles);

    const leftTiles = newTiles.filter((t) => t.zone === 'left' || t.x < 400);
    const rightTiles = newTiles.filter((t) => t.zone === 'right' || t.x >= 400);
    const leftBd = computeExpressionBreakdown(leftTiles);
    const rightBd = computeExpressionBreakdown(rightTiles);

    const label = `${sign > 0 ? '+ ' : '- '}${kind === 'unit' ? '1' : kind}`;
    setEquationSteps((prev) => [
      ...prev,
      {
        description: `Add ${label} to both sides`,
        leftLatex: leftBd.simplifiedLatex,
        rightLatex: rightBd.simplifiedLatex,
      },
    ]);
  };

  // Divide & Find 1x: align right constants in rows matching left x-tiles
  const handleDivideAndGroup = () => {
    playSound('snap');
    const { updatedTiles, unitPerRow, isDivisible } = groupConstantsByXRows(tiles, 400);
    setTiles(updatedTiles);
    recordHistory(updatedTiles);

    if (isDivisible) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setEquationSteps((prev) => [
      ...prev,
      {
        description: `Grouped into rows: 1x = ${unitPerRow}`,
        leftLatex: 'x',
        rightLatex: `${unitPerRow}`,
        isSolved: true,
      },
    ]);
  };

  // Auto-arrange factoring area rectangle
  const handleAutoArrangeFactoring = () => {
    playSound('snap');
    if (activeFactoringAnalysis?.factor1 && activeFactoringAnalysis?.factor2) {
      const arranged = autoArrangeFactoredRectangle(
        tiles,
        activeFactoringAnalysis.factor1.unit,
        activeFactoringAnalysis.factor2.unit,
        220,
        220
      );
      setTiles(arranged);
      recordHistory(arranged);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Spawn a tile from the palette
  const handleSpawnTile = (kind: TileKind, sign: TileSign, rotation: 0 | 90 = 0) => {
    playSound('pickup');
    const id = `tile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const spawnX = 120 + ((tiles.length * 24) % 180);
    const spawnY = 120 + ((tiles.length * 18) % 160);

    let zone: TileData['zone'] = 'main';
    if (mode === 'equation') {
      zone = spawnX < 400 ? 'left' : 'right';
    } else if (mode === 'factor') {
      zone = 'product_area';
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

    if (mode === 'equation') {
      const leftTiles = updated.filter((t) => t.zone === 'left' || t.x < 400);
      const rightTiles = updated.filter((t) => t.zone === 'right' || t.x >= 400);
      const leftBd = computeExpressionBreakdown(leftTiles);
      const rightBd = computeExpressionBreakdown(rightTiles);

      setEquationSteps((prev) => [
        ...prev,
        {
          description: `Cancelled ${pairs.length} zero pair${pairs.length > 1 ? 's' : ''}`,
          leftLatex: leftBd.simplifiedLatex,
          rightLatex: rightBd.simplifiedLatex,
        },
      ]);
    }
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

  // Compute live mathematical summaries for the compact header badge
  const zeroPairs = findZeroPairs(tiles);
  const leftSideTiles = tiles.filter((t) => t.zone === 'left' || t.x < 400);
  const rightSideTiles = tiles.filter((t) => t.zone === 'right' || t.x >= 400);
  const leftXCount = leftSideTiles.filter((t) => t.kind === 'x').length;
  const rightUnitCount = rightSideTiles.filter((t) => t.kind === 'unit').length;
  const isEquationSolved =
    leftXCount === 1 &&
    leftSideTiles.filter((t) => t.kind === 'unit').length === 0 &&
    rightSideTiles.filter((t) => t.kind === 'x').length === 0 &&
    zeroPairs.length === 0;

  const leftBreakdown = computeExpressionBreakdown(leftSideTiles);
  const rightBreakdown = computeExpressionBreakdown(rightSideTiles);
  const totalBreakdown = computeExpressionBreakdown(tiles);
  const factoringAnalysisResult = computeFactoringModel(tiles);

  let mathSummary = {
    latex: totalBreakdown.simplifiedLatex || '0',
    label: 'Expression',
    isBalanced: false,
    isValidProduct: false,
  };

  if (mode === 'equation') {
    const isBalanced =
      leftSideTiles.length > 0 &&
      rightSideTiles.length > 0 &&
      leftBreakdown.simplifiedLatex === rightBreakdown.simplifiedLatex;
    mathSummary = {
      latex: `${leftBreakdown.simplifiedLatex || '0'} = ${rightBreakdown.simplifiedLatex || '0'}`,
      label: 'Equation',
      isBalanced,
      isValidProduct: false,
    };
  } else if (mode === 'factor') {
    mathSummary = {
      latex: factoringAnalysisResult.fullEquationLatex,
      label: 'Factoring Model',
      isBalanced: false,
      isValidProduct: factoringAnalysisResult.isValidFactorization,
    };
  }

  // Export workspace as image
  const handleExportPNG = () => {
    playSound('click');
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Algebra Tiles Studio — Sir Eugene Technologies', 40, 50);

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
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none touch-none"
    >
      {/* 1. Consolidated Clean Top Header with Mode Selector & Live Math Badge */}
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
        mathSummary={mathSummary}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isQuestionBarOpen={isQuestionBarOpen}
        onToggleQuestionBar={() => setIsQuestionBarOpen(!isQuestionBarOpen)}
      />

      {/* 2. Compact Collapsible Question Input Bar */}
      <CustomQuestionBar
        mode={mode}
        onAutoLoadQuestion={handleAutoLoadQuestion}
        onSelfPlaceQuestion={handleSelfPlaceQuestion}
        activeTargetQuestion={activeTargetQuestion}
        onClearActiveQuestion={() => setActiveTargetQuestion(null)}
        isOpen={isQuestionBarOpen}
        onClose={() => setIsQuestionBarOpen(false)}
      />

      {/* 3. Maximized Canvas Viewport (> 75% screen height) */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* Interactive Workspace Canvas */}
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
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

          {/* Compact Equation Solving Actions (Equation Mat Mode) */}
          {mode === 'equation' && (
            <div className="absolute top-2 left-3 right-3 z-30 pointer-events-auto">
              <EquationStepToolbar
                tiles={tiles}
                onAddBothSides={handleAddBothSides}
                onCancelZeroPairs={handleCancelAllZeroPairs}
                onDivideAndGroup={handleDivideAndGroup}
                zeroPairCount={zeroPairs.length}
                steps={equationSteps}
                onResetSteps={() => {
                  setEquationSteps([
                    {
                      description: 'Reset Steps',
                      leftLatex: computeExpressionBreakdown(leftSideTiles).simplifiedLatex,
                      rightLatex: computeExpressionBreakdown(rightSideTiles).simplifiedLatex,
                    },
                  ]);
                }}
                isSolved={isEquationSolved}
                leftXCount={leftXCount}
                rightUnitCount={rightUnitCount}
              />
            </div>
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
            customTarget={
              activeTargetQuestion
                ? { rawString: activeTargetQuestion, factoringAnalysis: activeFactoringAnalysis }
                : null
            }
            onAutoArrangeFactoring={handleAutoArrangeFactoring}
          />
        </div>

        {/* Optional Right Algebraic Inspector Drawer */}
        {isInspectorOpen && (
          <ExpressionInspector
            className="w-72 lg:w-80 flex-shrink-0 z-20 shadow-2xl border-l border-slate-800"
            tiles={tiles}
            mode={mode}
            autoCancelZeroPairs={autoCancelZeroPairs}
            onToggleAutoCancel={() => setAutoCancelZeroPairs(!autoCancelZeroPairs)}
            onCancelAllZeroPairs={handleCancelAllZeroPairs}
            onOrganizeStandardOrder={handleOrganizeStandardOrder}
            onClearCanvas={handleClearCanvas}
          />
        )}
      </div>

      {/* 4. Docked Slim Socratic AI Coach Ribbon (Single line at bottom) */}
      <SocraticCoachBar
        tiles={tiles}
        mode={mode}
        customTarget={
          activeTargetQuestion
            ? { rawString: activeTargetQuestion, factoringAnalysis: activeFactoringAnalysis }
            : null
        }
      />

      {/* 5. Streamlined Slim Bottom Tile Toolbox Strip ([+x²] [+x] [+1] [-x²] [-x] [-1] [Cancel] [Organize] [Clear]) */}
      <SlimTileToolbox
        onSpawnTile={handleSpawnTile}
        onClearCanvas={handleClearCanvas}
        onCancelZeroPairs={handleCancelAllZeroPairs}
        onOrganizeStandardOrder={handleOrganizeStandardOrder}
        zeroPairCount={zeroPairs.length}
      />

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
