import React, { useState } from 'react';
import { TileData, WorkspaceMode, ExpressionBreakdown } from '../types';
import { computeExpressionBreakdown, evaluateExpression } from '../utils/mathEngine';
import { MathView } from './MathView';
import {
  Calculator,
  Sparkles,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  LayoutGrid,
  Scale,
  Trash2,
  Share2,
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface ExpressionInspectorProps {
  tiles: TileData[];
  mode: WorkspaceMode;
  autoCancelZeroPairs: boolean;
  onToggleAutoCancel: () => void;
  onCancelAllZeroPairs: () => void;
  onOrganizeStandardOrder: () => void;
  onClearCanvas: () => void;
  className?: string;
}

export const ExpressionInspector: React.FC<ExpressionInspectorProps> = ({
  tiles,
  mode,
  autoCancelZeroPairs,
  onToggleAutoCancel,
  onCancelAllZeroPairs,
  onOrganizeStandardOrder,
  onClearCanvas,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [xVal, setXVal] = useState<number>(3);
  const [yVal, setYVal] = useState<number>(2);

  // Overall tiles breakdown
  const breakdown = computeExpressionBreakdown(tiles);
  const evaluatedVal = evaluateExpression(breakdown, xVal, yVal);

  // Separate Left vs Right for Equation Mode
  const leftTiles = tiles.filter((t) => t.zone === 'left');
  const rightTiles = tiles.filter((t) => t.zone === 'right');
  const leftBreakdown = computeExpressionBreakdown(leftTiles);
  const rightBreakdown = computeExpressionBreakdown(rightTiles);

  // Check if equation balanced
  const isEquationBalanced =
    mode === 'equation' &&
    leftTiles.length > 0 &&
    rightTiles.length > 0 &&
    leftBreakdown.simplifiedLatex === rightBreakdown.simplifiedLatex;

  const handleCopyLatex = () => {
    playSound('click');
    const textToCopy =
      mode === 'equation'
        ? `${leftBreakdown.simplifiedLatex} = ${rightBreakdown.simplifiedLatex}`
        : breakdown.simplifiedLatex;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="expression-inspector-sidebar"
      className={`flex flex-col bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-100 select-none overflow-y-auto ${className}`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-slate-100 tracking-wide">
            Algebraic Readout
          </h2>
        </div>
        <button
          id="copy-latex-btn"
          type="button"
          title="Copy LaTeX"
          className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          onClick={handleCopyLatex}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Main Expression Box */}
      <div className="p-4 space-y-4">
        {/* Dynamic Display */}
        {mode === 'equation' ? (
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Equation Model</span>
              {isEquationBalanced && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold lowercase">
                  <CheckCircle2 className="w-3 h-3" /> balanced
                </span>
              )}
            </div>
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="text-xl font-bold text-cyan-300 overflow-x-auto max-w-full pb-1">
                <MathView latex={`${leftBreakdown.simplifiedLatex || '0'} = ${rightBreakdown.simplifiedLatex || '0'}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div className="text-cyan-400">Left: {leftTiles.length} tiles</div>
              <div className="text-amber-400 text-right">Right: {rightTiles.length} tiles</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/90 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Simplified Expression</span>
              <span className="text-[10px] text-slate-500 font-mono">{tiles.length} tiles total</span>
            </div>
            <div className="flex items-center justify-center py-3 min-h-[4rem] text-center overflow-x-auto">
              <span className="text-2xl font-extrabold text-cyan-300 tracking-wide">
                <MathView latex={breakdown.simplifiedLatex} />
              </span>
            </div>
            {breakdown.expandedPolynomial !== breakdown.simplifiedLatex && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-500">Unsimplified: </span>
                <MathView latex={breakdown.expandedPolynomial} className="text-xs text-slate-300" />
              </div>
            )}
          </div>
        )}

        {/* Term Breakdown Table */}
        <div className="bg-slate-950/50 rounded-xl border border-slate-800/70 p-3">
          <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
            <span>Like Terms Summary</span>
            <span className="text-[10px] text-slate-500">Net Coefficients</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* x² */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
              <span className="font-mono text-emerald-400 font-bold">x² terms:</span>
              <span className="font-mono font-semibold text-slate-200">{breakdown.x2}</span>
            </div>
            {/* xy */}
            {(breakdown.xy !== 0 || tiles.some((t) => t.kind === 'xy')) && (
              <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
                <span className="font-mono text-purple-400 font-bold">xy terms:</span>
                <span className="font-mono font-semibold text-slate-200">{breakdown.xy}</span>
              </div>
            )}
            {/* y² */}
            {(breakdown.y2 !== 0 || tiles.some((t) => t.kind === 'y2')) && (
              <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
                <span className="font-mono text-blue-400 font-bold">y² terms:</span>
                <span className="font-mono font-semibold text-slate-200">{breakdown.y2}</span>
              </div>
            )}
            {/* x */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
              <span className="font-mono text-emerald-400 font-bold">x terms:</span>
              <span className="font-mono font-semibold text-slate-200">{breakdown.x}</span>
            </div>
            {/* y */}
            {(breakdown.y !== 0 || tiles.some((t) => t.kind === 'y')) && (
              <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
                <span className="font-mono text-blue-400 font-bold">y terms:</span>
                <span className="font-mono font-semibold text-slate-200">{breakdown.y}</span>
              </div>
            )}
            {/* Units (1) */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
              <span className="font-mono text-amber-400 font-bold">Constants (1):</span>
              <span className="font-mono font-semibold text-slate-200">{breakdown.unit}</span>
            </div>
          </div>
        </div>

        {/* Zero-Pair Hub */}
        <div className="bg-slate-950/50 rounded-xl border border-slate-800/70 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Pair Actions</span>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
              <input
                id="auto-cancel-toggle-checkbox"
                type="checkbox"
                checked={autoCancelZeroPairs}
                onChange={onToggleAutoCancel}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Auto-cancel</span>
            </label>
          </div>

          <button
            id="cancel-all-zeropairs-btn"
            type="button"
            className="w-full py-1.5 px-3 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            onClick={onCancelAllZeroPairs}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vaporize Zero Pairs (+ / -)</span>
          </button>
        </div>

        {/* Interactive Value Tester / Substitution Slider */}
        <div className="bg-slate-950/50 rounded-xl border border-slate-800/70 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <Sliders className="w-3.5 h-3.5" />
              <span>Evaluate for Values</span>
            </div>
            <span className="font-mono font-bold text-cyan-400 text-xs">
              = {isNaN(evaluatedVal) ? '0' : evaluatedVal}
            </span>
          </div>

          {/* x slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Variable x</span>
              <span className="text-emerald-400 font-bold">{xVal}</span>
            </div>
            <input
              id="slider-var-x"
              type="range"
              min="-5"
              max="10"
              value={xVal}
              onChange={(e) => setXVal(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* y slider */}
          {tiles.some((t) => t.kind === 'y' || t.kind === 'y2' || t.kind === 'xy') && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Variable y</span>
                <span className="text-blue-400 font-bold">{yVal}</span>
              </div>
              <input
                id="slider-var-y"
                type="range"
                min="-5"
                max="10"
                value={yVal}
                onChange={(e) => setYVal(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Utility Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            id="organize-standard-order-btn"
            type="button"
            className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            onClick={onOrganizeStandardOrder}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neatly Align Polynomial</span>
          </button>

          <button
            id="clear-canvas-btn"
            type="button"
            className="w-full py-1.5 px-3 rounded-lg bg-red-950/30 hover:bg-red-950/60 text-red-300 hover:text-red-200 text-xs font-semibold flex items-center justify-center gap-2 border border-red-800/40 transition-colors"
            onClick={onClearCanvas}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
