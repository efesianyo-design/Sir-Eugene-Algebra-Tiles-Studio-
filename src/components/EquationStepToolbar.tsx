import React, { useState } from 'react';
import { TileData, TileKind, TileSign } from '../types';
import { playSound } from '../utils/audio';
import { MathView } from './MathView';
import {
  Plus,
  Minus,
  Sparkles,
  Divide,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

export interface EquationStep {
  description: string;
  leftLatex: string;
  rightLatex: string;
  isSolved?: boolean;
}

interface EquationStepToolbarProps {
  tiles: TileData[];
  onAddBothSides: (kind: TileKind, sign: TileSign, count?: number) => void;
  onCancelZeroPairs: () => void;
  onDivideAndGroup: () => void;
  zeroPairCount: number;
  steps: EquationStep[];
  onResetSteps: () => void;
  isSolved: boolean;
  leftXCount: number;
  rightUnitCount: number;
}

export const EquationStepToolbar: React.FC<EquationStepToolbarProps> = ({
  tiles,
  onAddBothSides,
  onCancelZeroPairs,
  onDivideAndGroup,
  zeroPairCount,
  steps,
  onResetSteps,
  isSolved,
  leftXCount,
  rightUnitCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const canDivide = leftXCount > 1 && rightUnitCount !== 0;
  const latestStep = steps[steps.length - 1];

  return (
    <div
      id="equation-step-toolbar-compact"
      className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-lg flex flex-col gap-1.5 text-slate-100 max-w-full"
    >
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        {/* Step Status Badge */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
          <span className="text-[11px] font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-600/40">
            Step {steps.length}: {latestStep?.description || 'Equation'}
          </span>
          {isSolved && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Solved!
            </span>
          )}
        </div>

        {/* Action Buttons: Add -1, Add +1, Add -x, Divide */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Add -1 */}
          <button
            id="btn-quick-add-neg1"
            type="button"
            className="min-h-[32px] px-2 py-0.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 active:scale-95 text-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            onClick={() => {
              playSound('pickup');
              onAddBothSides('unit', -1);
            }}
            title="Add -1 to both sides"
          >
            <Minus className="w-3 h-3 text-red-400" />
            <span>-1 both sides</span>
          </button>

          {/* Add +1 */}
          <button
            id="btn-quick-add-pos1"
            type="button"
            className="min-h-[32px] px-2 py-0.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 active:scale-95 text-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            onClick={() => {
              playSound('pickup');
              onAddBothSides('unit', 1);
            }}
            title="Add +1 to both sides"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>+1 both sides</span>
          </button>

          {/* Add -x */}
          <button
            id="btn-quick-add-negx"
            type="button"
            className="min-h-[32px] px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 active:scale-95 text-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            onClick={() => {
              playSound('pickup');
              onAddBothSides('x', -1);
            }}
            title="Add -x to both sides"
          >
            <Minus className="w-3 h-3 text-rose-400" />
            <span>-x both sides</span>
          </button>

          {/* ➗ Divide */}
          <button
            id="btn-quick-divide"
            type="button"
            disabled={!canDivide}
            className={`min-h-[32px] px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              canDivide
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-95 shadow-sm'
                : 'bg-slate-800/60 border border-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            onClick={onDivideAndGroup}
            title="Group into equal rows (Find 1x)"
          >
            <Divide className="w-3 h-3" />
            <span>➗ Find 1x</span>
          </button>

          {/* Collapse/Expand History */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
            title={isExpanded ? 'Hide Step Trail' : 'Show Step Trail'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Step Breadcrumb Trail */}
      {isExpanded && steps.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 border-t border-slate-800 text-[11px]">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0 font-mono text-slate-300"
            >
              <span className="text-slate-500">{idx + 1}.</span>
              <span className="font-semibold text-slate-200">{step.description}</span>
              <span className="text-cyan-400 font-bold">
                (<MathView latex={`${step.leftLatex} = ${step.rightLatex}`} />)
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={onResetSteps}
            className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto flex items-center gap-0.5 flex-shrink-0"
            title="Reset steps"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
};
