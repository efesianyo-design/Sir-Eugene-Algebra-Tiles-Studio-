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
              {/* Positive Button */}
              <button
                id={`spawn-pos-${item.kind}-${item.rotation || 0}`}
                type="button"
                className="group relative flex flex-col items-center justify-center p-2 rounded-lg border border-emerald-600/30 hover:border-emerald-500/80 active:scale-95 transition-all bg-slate-900/80 hover:bg-emerald-950/20"
                onClick={() => {
                  playSound('pickup');
                  onSpawnTile(item.kind, 1, item.rotation || 0);
                }}
              >
                <div
                  className={`${item.aspectClass} rounded flex items-center justify-center font-bold text-xs shadow-md border mb-1`}
                  style={{
                    backgroundColor: item.posBg,
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: item.kind === 'unit' ? '#422006' : '#ffffff',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  + {item.kind === 'unit' ? '1' : item.kind}
                </span>
              </button>

              {/* Negative Button */}
              <button
                id={`spawn-neg-${item.kind}-${item.rotation || 0}`}
                type="button"
                className="group relative flex flex-col items-center justify-center p-2 rounded-lg border border-red-600/30 hover:border-red-500/80 active:scale-95 transition-all bg-slate-900/80 hover:bg-red-950/20"
                onClick={() => {
                  playSound('pickup');
                  onSpawnTile(item.kind, -1, item.rotation || 0);
                }}
              >
                <div
                  className={`${item.aspectClass} rounded flex items-center justify-center font-bold text-xs shadow-md border mb-1`}
                  style={{
                    backgroundColor: item.negBg,
                    borderColor: 'rgba(255,255,255,0.4)',
                    color: '#ffffff',
                  }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-red-400">
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
          <div className="grid grid-cols-1 gap-1.5">
            <button
              id="preset-quad-btn"
              type="button"
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              onClick={() => onQuickPreset('quad')}
            >
              <span>x² + 3x + 2</span>
              <span className="text-[10px] text-emerald-400 font-mono">Factorable</span>
            </button>
            <button
              id="preset-linear-btn"
              type="button"
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              onClick={() => onQuickPreset('linear')}
            >
              <span>2x + 4</span>
              <span className="text-[10px] text-cyan-400 font-mono">Linear</span>
            </button>
            <button
              id="preset-zeropair-btn"
              type="button"
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              onClick={() => onQuickPreset('zeropair')}
            >
              <span>3x - 2x + 2 - 2</span>
              <span className="text-[10px] text-amber-400 font-mono">Zero Pairs</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
