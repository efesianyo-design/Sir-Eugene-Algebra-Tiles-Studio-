import React, { useState } from 'react';
import { TileData, TileKind, TileSign, WorkspaceMode } from '../types';
import { TilePalette } from './TilePalette';
import { MathView } from './MathView';
import { computeExpressionBreakdown } from '../utils/mathEngine';
import { ChevronUp, ChevronDown, Layers, Calculator, Sparkles, Trash2, LayoutGrid } from 'lucide-react';

interface MobileBottomTrayProps {
  tiles: TileData[];
  mode: WorkspaceMode;
  onSpawnTile: (kind: TileKind, sign: TileSign, rotation?: 0 | 90) => void;
  onCancelAllZeroPairs: () => void;
  onOrganizeStandardOrder: () => void;
  onClearCanvas: () => void;
  onOpenChallenges: () => void;
}

export const MobileBottomTray: React.FC<MobileBottomTrayProps> = ({
  tiles,
  mode,
  onSpawnTile,
  onCancelAllZeroPairs,
  onOrganizeStandardOrder,
  onClearCanvas,
  onOpenChallenges,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiles' | 'expression'>('tiles');

  const breakdown = computeExpressionBreakdown(tiles);

  return (
    <div
      id="mobile-bottom-tray"
      className="flex flex-col h-full w-full bg-white text-slate-800 select-none overflow-hidden"
    >
      {/* Top Handle / Ribbon Header */}
      <div
        className="h-11 px-3 flex items-center justify-between border-b border-slate-200 cursor-pointer bg-slate-50 flex-shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Toggle Icon & Label */}
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-indigo-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-indigo-600" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {isExpanded ? 'Tile Drawer & Inspector' : 'Tile Toolbox'}
          </span>
        </div>

        {/* Real-time Math Expression Pill */}
        <div className="flex items-center gap-2 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Expr:</span>
          <span className="text-xs font-bold text-indigo-700 max-w-[140px] truncate">
            <MathView latex={breakdown.simplifiedLatex} />
          </span>
        </div>
      </div>

      {/* Main Bottom Toolbox Body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {!isExpanded ? (
          /* Standard Fixed Toolbox Mode */
          <div className="flex-1 p-2 flex flex-col justify-center gap-2">
            {/* Quick Horizontal Ribbon of Tiles */}
            <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden py-1">
              <button
                id="mobile-quick-pos-1"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('unit', 1)}
              >
                +1
              </button>
              <button
                id="mobile-quick-neg-1"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('unit', -1)}
              >
                -1
              </button>
              <button
                id="mobile-quick-pos-x"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('x', 1, 0)}
              >
                +x
              </button>
              <button
                id="mobile-quick-neg-x"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('x', -1, 0)}
              >
                -x
              </button>
              <button
                id="mobile-quick-pos-x2"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('x2', 1)}
              >
                +x²
              </button>
              <button
                id="mobile-quick-neg-x2"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('x2', -1)}
              >
                -x²
              </button>
              <button
                id="mobile-quick-pos-y"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('y', 1)}
              >
                +y
              </button>
              <button
                id="mobile-quick-neg-y"
                type="button"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-300 text-xs font-bold active:scale-95 shadow-2xs"
                onClick={() => onSpawnTile('y', -1)}
              >
                -y
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                id="mobile-zeropairs-quick-btn"
                type="button"
                className="flex-1 py-1 px-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                onClick={onCancelAllZeroPairs}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Zero Pairs</span>
              </button>
              <button
                id="mobile-align-quick-btn"
                type="button"
                className="flex-1 py-1 px-2 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                onClick={onOrganizeStandardOrder}
              >
                <LayoutGrid className="w-3 h-3 text-indigo-600" />
                <span>Align</span>
              </button>
              <button
                id="mobile-clear-quick-btn"
                type="button"
                className="py-1 px-2.5 bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                onClick={onClearCanvas}
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Full Drawer */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Drawer Tab Switcher */}
            <div className="flex border-b border-slate-200 px-3 gap-2 bg-slate-50 py-1.5 flex-shrink-0">
              <button
                id="mobile-tab-tiles"
                type="button"
                className={`flex-1 py-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                  activeTab === 'tiles' ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs' : 'text-slate-500'
                }`}
                onClick={() => setActiveTab('tiles')}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Tile Bank</span>
              </button>
              <button
                id="mobile-tab-inspector"
                type="button"
                className={`flex-1 py-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                  activeTab === 'expression' ? 'bg-white text-indigo-700 border border-slate-200 shadow-2xs' : 'text-slate-500'
                }`}
                onClick={() => setActiveTab('expression')}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Live Expression</span>
              </button>
            </div>

            {/* Drawer Tab Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'tiles' ? (
                <TilePalette onSpawnTile={onSpawnTile} isCompact={true} />
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Simplified Expression</div>
                    <div className="text-xl font-serif text-slate-800 py-1">
                      <MathView latex={breakdown.simplifiedLatex} />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="p-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      onClick={onCancelAllZeroPairs}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cancel Zero Pairs</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                      onClick={onOrganizeStandardOrder}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Align Neatly</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="w-full p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                    onClick={onClearCanvas}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Workspace</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
