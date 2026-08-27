import React from 'react';
import { TileKind, TileSign } from '../types';
import { TILE_COLOR_CONFIG } from '../utils/constants';
import { Plus, Minus, Layers, Sparkles } from 'lucide-react';
import { playSound } from '../utils/audio';

interface TilePaletteProps {
  onSpawnTile: (kind: TileKind, sign: TileSign, rotation?: 0 | 90) => void;
  onSpawnBatch?: (kind: TileKind, sign: TileSign, count: number) => void;
  onQuickPreset?: (preset: 'quad' | 'linear' | 'zeropair') => void;
  className?: string;
  isCompact?: boolean;
}

interface PaletteItem {
  kind: TileKind;
  rotation?: 0 | 90;
  label: string;
  sublabel: string;
  posBg: string;
  negBg: string;
  aspectClass: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    kind: 'unit',
    label: '1 / -1',
    sublabel: 'Unit Tile (28 × 28px)',
    posBg: TILE_COLOR_CONFIG.unit.posBg,
    negBg: TILE_COLOR_CONFIG.unit.negBg,
    aspectClass: 'w-7 h-7',
  },
  {
    kind: 'x',
    rotation: 0,
    label: 'x (horiz)',
    sublabel: 'Variable Tile (148 × 28px)',
    posBg: TILE_COLOR_CONFIG.x.posBg,
    negBg: TILE_COLOR_CONFIG.x.negBg,
    aspectClass: 'w-14 h-6',
  },
  {
    kind: 'x',
    rotation: 90,
    label: 'x (vert)',
    sublabel: 'Variable Tile (28 × 148px)',
    posBg: TILE_COLOR_CONFIG.x.posBg,
    negBg: TILE_COLOR_CONFIG.x.negBg,
    aspectClass: 'w-6 h-14',
  },
  {
    kind: 'x2',
    label: 'x² / -x²',
    sublabel: 'Quadratic Tile (148 × 148px)',
    posBg: TILE_COLOR_CONFIG.x2.posBg,
    negBg: TILE_COLOR_CONFIG.x2.negBg,
    aspectClass: 'w-12 h-12',
  },
  {
    kind: 'y',
    rotation: 0,
    label: 'y (horiz)',
    sublabel: 'Variable Tile (148 × 28px)',
    posBg: TILE_COLOR_CONFIG.y.posBg,
    negBg: TILE_COLOR_CONFIG.y.negBg,
    aspectClass: 'w-14 h-6',
  },
  {
    kind: 'y2',
    label: 'y²',
    sublabel: 'Quadratic Tile (148 × 148px)',
    posBg: TILE_COLOR_CONFIG.y2.posBg,
    negBg: TILE_COLOR_CONFIG.y2.negBg,
    aspectClass: 'w-12 h-12',
  },
  {
    kind: 'xy',
    rotation: 0,
    label: 'xy',
    sublabel: 'Product Tile (148 × 148px)',
    posBg: TILE_COLOR_CONFIG.xy.posBg,
    negBg: TILE_COLOR_CONFIG.xy.negBg,
    aspectClass: 'w-12 h-12',
  },
];

export const TilePalette: React.FC<TilePaletteProps> = ({
  onSpawnTile,
  onSpawnBatch,
  onQuickPreset,
  className = '',
  isCompact = false,
}) => {
  return (
    <div
      id="tile-palette-sidebar"
      className={`flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-200 select-none overflow-y-auto ${className}`}
    >
      {/* Header */}
      {!isCompact && (
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-slate-100 tracking-wide">
              Tile Bank
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full font-medium">
            Tap or Drag
          </span>
        </div>
      )}

      {/* Tiles list */}
      <div className={`p-3 space-y-2.5 ${isCompact ? 'flex flex-row items-center gap-3 space-y-0 overflow-x-auto py-2' : ''}`}>
        {PALETTE_ITEMS.map((item, idx) => (
          <div
            key={`${item.kind}-${item.rotation || 0}-${idx}`}
            className={`bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all ${
              isCompact ? 'flex-shrink-0 min-w-[140px]' : ''
            }`}
          >
            {/* Title & Dimension */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {item.kind}
              </span>
            </div>

            {/* Positive & Negative Spawn Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Positive Button (Min 44px tap target) */}
              <button
                id={`spawn-pos-${item.kind}-${item.rotation || 0}`}
                type="button"
                className="min-h-[52px] group relative flex flex-col items-center justify-center p-2 rounded-xl border border-emerald-600/40 hover:border-emerald-500 active:scale-95 transition-all bg-slate-900/90 hover:bg-emerald-950/30"
                onClick={() => {
                  playSound('pickup');
                  onSpawnTile(item.kind, 1, item.rotation || 0);
                }}
              >
                <div
                  className={`${item.aspectClass} rounded-md flex items-center justify-center font-bold text-xs shadow-md border mb-1`}
                  style={{
                    backgroundColor: item.posBg,
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: item.kind === 'unit' ? '#422006' : '#ffffff',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400">
                  + {item.kind === 'unit' ? '1' : item.kind}
                </span>
              </button>

              {/* Negative Button (Min 44px tap target) */}
              <button
                id={`spawn-neg-${item.kind}-${item.rotation || 0}`}
                type="button"
                className="min-h-[52px] group relative flex flex-col items-center justify-center p-2 rounded-xl border border-red-600/40 hover:border-red-500 active:scale-95 transition-all bg-slate-900/90 hover:bg-red-950/30"
                onClick={() => {
                  playSound('pickup');
                  onSpawnTile(item.kind, -1, item.rotation || 0);
                }}
              >
                <div
                  className={`${item.aspectClass} rounded-md flex items-center justify-center font-bold text-xs shadow-md border mb-1`}
                  style={{
                    backgroundColor: item.negBg,
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: '#ffffff',
                  }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-red-400">
                  - {item.kind === 'unit' ? '1' : item.kind}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Presets / Templates for Fast Exploration */}
      {!isCompact && onQuickPreset && (
        <div className="p-3 border-t border-slate-800 mt-auto bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Polynomials</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              id="preset-quad-btn"
              type="button"
              className="min-h-[44px] w-full text-left text-xs px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white flex items-center justify-between transition-colors border border-slate-700/50"
              onClick={() => onQuickPreset('quad')}
            >
              <span className="font-semibold">x² + 3x + 2</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">Factorable</span>
            </button>
            <button
              id="preset-linear-btn"
              type="button"
              className="min-h-[44px] w-full text-left text-xs px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white flex items-center justify-between transition-colors border border-slate-700/50"
              onClick={() => onQuickPreset('linear')}
            >
              <span className="font-semibold">2x + 4 = 8</span>
              <span className="text-[11px] text-cyan-400 font-mono font-bold">Equation</span>
            </button>
            <button
              id="preset-zeropair-btn"
              type="button"
              className="min-h-[44px] w-full text-left text-xs px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-98 text-slate-200 hover:text-white flex items-center justify-between transition-colors border border-slate-700/50"
              onClick={() => onQuickPreset('zeropair')}
            >
              <span className="font-semibold">Zero-Pair Demo</span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">Overlapping</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
