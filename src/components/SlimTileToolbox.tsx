import React from 'react';
import { TileKind, TileSign } from '../types';
import { TILE_COLOR_CONFIG } from '../utils/constants';
import { Plus, Minus, Trash2, Sparkles, LayoutGrid, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/audio';

interface TilePaletteProps {
  onSpawnTile: (kind: TileKind, sign: TileSign, rotation?: 0 | 90) => void;
  onClearCanvas?: () => void;
  onCancelZeroPairs?: () => void;
  onOrganizeStandardOrder?: () => void;
  zeroPairCount?: number;
}

export const SlimTileToolbox: React.FC<TilePaletteProps> = ({
  onSpawnTile,
  onClearCanvas,
  onCancelZeroPairs,
  onOrganizeStandardOrder,
  zeroPairCount = 0,
}) => {
  return (
    <div
      id="slim-tile-toolbox-strip"
      className="h-12 bg-slate-900 border-t border-slate-800 px-2 sm:px-4 flex items-center justify-between gap-2 select-none z-30 flex-shrink-0 shadow-lg"
    >
      {/* Primary Tile Spawners Strip: [+x²] [+x] [+1] [-x²] [-x] [-1] */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {/* +x² */}
        <button
          id="tool-spawn-pos-x2"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 active:scale-95 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('x2', 1);
          }}
          title="Spawn +x² tile"
        >
          <div className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400/50 flex-shrink-0" />
          <span>+x²</span>
        </button>

        {/* +x */}
        <button
          id="tool-spawn-pos-x"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 active:scale-95 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('x', 1, 0);
          }}
          title="Spawn +x tile (horizontal)"
        >
          <div className="w-4 h-2.5 rounded bg-emerald-600 border border-emerald-400/50 flex-shrink-0" />
          <span>+x</span>
        </button>

        {/* +1 */}
        <button
          id="tool-spawn-pos-1"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 active:scale-95 text-amber-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('unit', 1);
          }}
          title="Spawn +1 unit tile"
        >
          <div className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-300/50 flex-shrink-0" />
          <span>+1</span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-0.5 flex-shrink-0" />

        {/* -x² */}
        <button
          id="tool-spawn-neg-x2"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-500/50 active:scale-95 text-red-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('x2', -1);
          }}
          title="Spawn -x² tile"
        >
          <div className="w-3.5 h-3.5 rounded bg-red-600 border border-red-400/50 flex-shrink-0" />
          <span>-x²</span>
        </button>

        {/* -x */}
        <button
          id="tool-spawn-neg-x"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-500/50 active:scale-95 text-red-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('x', -1, 0);
          }}
          title="Spawn -x tile"
        >
          <div className="w-4 h-2.5 rounded bg-red-600 border border-red-400/50 flex-shrink-0" />
          <span>-x</span>
        </button>

        {/* -1 */}
        <button
          id="tool-spawn-neg-1"
          type="button"
          className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-500/50 active:scale-95 text-red-300 font-mono font-bold text-xs flex items-center gap-1 shadow-sm flex-shrink-0"
          onClick={() => {
            playSound('pickup');
            onSpawnTile('unit', -1);
          }}
          title="Spawn -1 unit tile"
        >
          <div className="w-2.5 h-2.5 rounded bg-red-600 border border-red-400/50 flex-shrink-0" />
          <span>-1</span>
        </button>
      </div>

      {/* Action Utilities: [Cancel Zero Pairs] [Organize] [Clear] */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Cancel Zero Pairs */}
        {onCancelZeroPairs && (
          <button
            id="tool-cancel-zero-pairs-btn"
            type="button"
            className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              zeroPairCount > 0
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-md animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            onClick={onCancelZeroPairs}
            title={zeroPairCount > 0 ? `${zeroPairCount} zero pair(s) ready to cancel!` : 'Cancel opposing zero pairs'}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zero Pairs</span>
            {zeroPairCount > 0 && <span className="font-mono">({zeroPairCount})</span>}
          </button>
        )}

        {/* Organize Tiles */}
        {onOrganizeStandardOrder && (
          <button
            id="tool-organize-tiles-btn"
            type="button"
            className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors active:scale-95 flex items-center gap-1"
            onClick={onOrganizeStandardOrder}
            title="Auto-organize tiles in standard algebraic order"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Organize</span>
          </button>
        )}

        {/* Clear Workspace */}
        {onClearCanvas && (
          <button
            id="tool-clear-canvas-btn"
            type="button"
            className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-300 border border-slate-700 hover:border-red-600/40 text-slate-400 text-xs font-bold transition-colors active:scale-95 flex items-center gap-1"
            onClick={onClearCanvas}
            title="Clear all tiles from workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};
