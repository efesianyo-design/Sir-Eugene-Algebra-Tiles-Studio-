import React from 'react';
import { TileData } from '../types';
import { getTileDimensions, TILE_COLOR_CONFIG } from '../utils/constants';
import { RotateCw, RefreshCw, Trash2, Copy } from 'lucide-react';

interface TileItemProps {
  tile: TileData;
  isSelected: boolean;
  isZeroPaired: boolean;
  isDissolving?: boolean;
  onPointerDown: (e: React.PointerEvent, tileId: string) => void;
  onFlipSign: (tileId: string) => void;
  onRotate: (tileId: string) => void;
  onDelete: (tileId: string) => void;
  onDuplicate: (tileId: string) => void;
}

export const TileItem: React.FC<TileItemProps> = ({
  tile,
  isSelected,
  isZeroPaired,
  isDissolving = false,
  onPointerDown,
  onFlipSign,
  onRotate,
  onDelete,
  onDuplicate,
}) => {
  const dim = getTileDimensions(tile.kind, tile.rotation);
  const colors = TILE_COLOR_CONFIG[tile.kind];
  const isPos = tile.sign > 0;
  const label = isPos ? colors.posLabel : colors.negLabel;
  const bgColor = isPos ? colors.posBg : colors.negBg;
  const borderColor = isPos ? colors.posBorder : colors.negBorder;
  const textColor = isPos ? colors.posText : colors.negText;

  const canRotate = tile.kind === 'x' || tile.kind === 'y' || tile.kind === 'xy';

  return (
    <div
      id={`tile-${tile.id}`}
      style={{
        position: 'absolute',
        transform: `translate3d(${tile.x}px, ${tile.y}px, 0)`,
        width: `${dim.width}px`,
        height: `${dim.height}px`,
        touchAction: 'none',
      }}
      className={`group cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
        isDissolving
          ? 'tile-dissolve z-50'
          : isZeroPaired
          ? 'zero-pair-glow z-30'
          : isSelected
          ? 'z-20'
          : 'z-10'
      }`}
      onPointerDown={(e) => {
        onPointerDown(e, tile.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFlipSign(tile.id);
      }}
    >
      {/* Visual Tile Box */}
      <div
        className={`w-full h-full rounded-md flex items-center justify-center relative overflow-hidden transition-all duration-150 border-2 select-none shadow-sm ${
          isSelected
            ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 border-white'
            : ''
        }`}
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          color: textColor,
          boxShadow: isSelected
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Subtle grid pattern / texture for tile depth */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* Top bevel highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/25 pointer-events-none" />

        {/* Tile mathematical symbol */}
        <span className="font-bold text-sm md:text-base tracking-tight drop-shadow-sm font-mono pointer-events-none">
          {label}
        </span>

        {/* 90° quick rotate button on variable tiles */}
        {canRotate && (
          <button
            id={`tile-quick-rotate-${tile.id}`}
            type="button"
            title="Rotate 90°"
            className="absolute top-1 right-1 p-1 rounded bg-black/25 hover:bg-black/50 text-white transition-opacity opacity-70 hover:opacity-100 active:scale-90 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRotate(tile.id);
            }}
          >
            <RotateCw className="w-3 h-3" />
          </button>
        )}

        {/* Zero pair badge if paired */}
        {isZeroPaired && (
          <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1 rounded shadow-sm border border-amber-600 animate-pulse">
            0-PAIR
          </div>
        )}
      </div>

      {/* Floating Action Buttons when Tile is Selected */}
      {isSelected && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700 shadow-xl z-50 pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Flip Sign Button */}
          <button
            id={`tile-flip-btn-${tile.id}`}
            type="button"
            title="Flip Sign (+ / -)"
            className="p-1 hover:bg-slate-700 active:bg-slate-600 text-amber-400 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFlipSign(tile.id);
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Rotate Button (if bar or rectangle) */}
          {canRotate && (
            <button
              id={`tile-rotate-btn-${tile.id}`}
              type="button"
              title="Rotate 90°"
              className="p-1 hover:bg-slate-700 active:bg-slate-600 text-emerald-400 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(tile.id);
              }}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate */}
          <button
            id={`tile-dup-btn-${tile.id}`}
            type="button"
            title="Duplicate Tile"
            className="p-1 hover:bg-slate-700 active:bg-slate-600 text-blue-400 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(tile.id);
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            id={`tile-del-btn-${tile.id}`}
            type="button"
            title="Delete Tile"
            className="p-1 hover:bg-red-950 active:bg-red-900 text-red-400 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tile.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
