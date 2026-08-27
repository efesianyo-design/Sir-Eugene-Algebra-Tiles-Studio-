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
        className="min-h-[44px] h-12 px-3 flex items-center justify-between border-b border-slate-200 cursor-pointer bg-slate-50 flex-shrink-0 active:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Toggle Icon & Label */}
        <div className="flex items-center gap-2 min-h-[44px]">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-indigo-600" />
          ) : (
            <ChevronUp className="w-5 h-5 text-indigo-600" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {isExpanded ? 'Tile Drawer & Inspector' : 'Tile Toolbox (Tap to Expand)'}
          </span>
        </div>

        {/* Real-time Math Expression Pill */}
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
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
          <div className="flex-1 p-2.5 flex flex-col justify-center gap-2.5">
            {/* Quick Horizontal Ribbon of Tiles (All >= 44px tap targets) */}
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1 px-0.5">
              <button
                id="mobile-quick-pos-1"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('unit', 1)}
              >
                +1
              </button>
              <button
                id="mobile-quick-neg-1"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 border border-red-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('unit', -1)}
              >
                -1
              </button>
              <button
                id="mobile-quick-pos-x"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('x', 1, 0)}
              >
                +x
              </button>
              <button
                id="mobile-quick-neg-x"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 border border-red-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('x', -1, 0)}
              >
                -x
              </button>
              <button
                id="mobile-quick-pos-x2"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[50px] px-3.5 py-2.5 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('x2', 1)}
              >
                +x²
              </button>
              <button
                id="mobile-quick-neg-x2"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[50px] px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 border border-red-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('x2', -1)}
              >
                -x²
              </button>
              <button
                id="mobile-quick-pos-y"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('y', 1)}
              >
                +y
              </button>
              <button
                id="mobile-quick-neg-y"
                type="button"
                className="flex-shrink-0 min-h-[44px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-red-100 text-red-700 border border-red-300 text-sm font-bold active:scale-95 shadow-sm flex items-center justify-center"
                onClick={() => onSpawnTile('y', -1)}
              >
                -y
              </button>
            </div>

            {/* Quick Actions Row (All >= 44px tap targets) */}
            <div className="flex items-center justify-between gap-2 px-0.5">
              <button
                id="mobile-zeropairs-quick-btn"
                type="button"
                className="flex-1 min-h-[44px] py-2.5 px-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:bg-amber-100 transition-colors shadow-2xs"
                onClick={onCancelAllZeroPairs}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Zero Pairs</span>
              </button>
              <button
                id="mobile-align-quick-btn"
                type="button"
                className="flex-1 min-h-[44px] py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:bg-slate-100 transition-colors shadow-2xs"
                onClick={onOrganizeStandardOrder}
              >
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                <span>Align</span>
              </button>
              <button
                id="mobile-clear-quick-btn"
                type="button"
                className="min-h-[44px] min-w-[44px] py-2.5 px-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:bg-red-100 transition-colors shadow-2xs"
                onClick={onClearCanvas}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        ) : (
          /* Expanded Full Drawer */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Drawer Tab Switcher (All >= 44px tap targets) */}
            <div className="flex border-b border-slate-200 px-3 gap-2 bg-slate-50 py-2 flex-shrink-0">
              <button
                id="mobile-tab-tiles"
                type="button"
                className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'tiles' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setActiveTab('tiles')}
              >
                <Layers className="w-4 h-4" />
                <span>Full Tile Bank</span>
              </button>
              <button
                id="mobile-tab-inspector"
                type="button"
                className={`flex-1 min-h-[44px] py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'expression' ? 'bg-white text-indigo-700 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setActiveTab('expression')}
              >
                <Calculator className="w-4 h-4" />
                <span>Live Expression</span>
              </button>
            </div>

            {/* Drawer Tab Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'tiles' ? (
                <TilePalette onSpawnTile={onSpawnTile} isCompact={true} />
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Simplified Expression</div>
                    <div className="text-xl font-serif text-slate-800 py-1.5">
                      <MathView latex={breakdown.simplifiedLatex} />
                    </div>
                  </div>

                  {/* Quick actions (All >= 44px tap targets) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="min-h-[44px] p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:bg-amber-100 transition-colors"
                      onClick={onCancelAllZeroPairs}
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Cancel Zero Pairs</span>
                    </button>
                    <button
                      type="button"
                      className="min-h-[44px] p-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:bg-slate-100 transition-colors"
                      onClick={onOrganizeStandardOrder}
                    >
                      <LayoutGrid className="w-4 h-4 text-indigo-600" />
                      <span>Align Neatly</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="w-full min-h-[44px] p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
                    onClick={onClearCanvas}
                  >
                    <Trash2 className="w-4 h-4" />
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
