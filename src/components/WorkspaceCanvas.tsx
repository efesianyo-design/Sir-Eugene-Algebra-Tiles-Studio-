import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TileData, TileKind, TileSign, WorkspaceMode, GridConfig, ZeroPairCandidate, SolidRectangleResult } from '../types';
import { TileItem } from './TileItem';
import { MathView } from './MathView';
import { BASE_UNIT, X_UNIT, Y_UNIT, getTileDimensions } from '../utils/constants';
import { playSound } from '../utils/audio';
import { findZeroPairs, computeExpressionBreakdown, detectSolidRectangle, computeFactoringModel } from '../utils/mathEngine';
import { logStudentActivity } from '../utils/studentLogs';
import {
  Maximize2,
  Sparkles,
  Scale,
  Grid,
  Magnet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  RefreshCw,
  ArrowLeftRight,
  Trash2,
  X,
  Layers,
  Award,
} from 'lucide-react';

import confetti from 'canvas-confetti';
import { FactoringAnalysis } from '../utils/mathParser';

interface WorkspaceCanvasProps {
  tiles: TileData[];
  mode: WorkspaceMode;
  gridConfig: GridConfig;
  setTiles: React.Dispatch<React.SetStateAction<TileData[]>>;
  onTilesChange: (newTiles: TileData[]) => void;
  autoCancelZeroPairs: boolean;
  onCancelZeroPair: (pair: ZeroPairCandidate) => void;
  onCancelAllZeroPairs: () => void;
  customTarget?: { rawString: string; factoringAnalysis?: FactoringAnalysis | null } | null;
  onAutoArrangeFactoring?: () => void;
}

export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  tiles,
  mode,
  gridConfig,
  setTiles,
  onTilesChange,
  autoCancelZeroPairs,
  onCancelZeroPair,
  onCancelAllZeroPairs,
  customTarget,
  onAutoArrangeFactoring,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(new Set());
  const [dissolvingTileIds, setDissolvingTileIds] = useState<Set<string>>(new Set());
  const [zeroPairBurst, setZeroPairBurst] = useState<{ id: string; x: number; y: number; label: string } | null>(null);

  // Canvas pan & zoom transformation (0.5x - 2.5x)
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });

  // Native Multi-Touch Tracking (2-finger pinch-to-zoom & 2-finger pan)
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<{
    initialDistance: number;
    initialMidpoint: { x: number; y: number };
    initialScale: number;
    initialViewX: number;
    initialViewY: number;
  } | null>(null);

  // Dragging state
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const dragTileIdRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTilePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Marquee / Box Selection state
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Factoring Celebration tracker
  const lastCelebratedEquationRef = useRef<string | null>(null);

  // Computed zero pairs and expression breakdown
  const zeroPairs = findZeroPairs(tiles);
  const zeroPairTileIds = new Set<string>();
  zeroPairs.forEach((p) => {
    zeroPairTileIds.add(p.tile1Id);
    zeroPairTileIds.add(p.tile2Id);
  });

  const expressionBreakdown = computeExpressionBreakdown(tiles);

  // Equation Mode left vs right side split
  const canvasMidX = (containerRef.current?.clientWidth || 800) / 2;
  const leftSideTiles = tiles.filter((t) => t.zone === 'left' || (t.zone !== 'right' && t.x < canvasMidX));
  const rightSideTiles = tiles.filter((t) => t.zone === 'right' || (t.zone !== 'left' && t.x >= canvasMidX));
  const leftBreakdown = computeExpressionBreakdown(leftSideTiles);
  const rightBreakdown = computeExpressionBreakdown(rightSideTiles);
  const isEquationBalanced =
    mode === 'equation' &&
    leftSideTiles.length > 0 &&
    rightSideTiles.length > 0 &&
    leftBreakdown.simplifiedLatex === rightBreakdown.simplifiedLatex;

  // Factoring Model & Solid Bounding Rectangle Detection
  const factoringModel = computeFactoringModel(
    tiles,
    gridConfig.unitSize,
    gridConfig.xSize,
    gridConfig.ySize,
    customTarget?.rawString
  );

  const solidRectResult: SolidRectangleResult =
    mode === 'factor' && factoringModel.solidRectangle
      ? factoringModel.solidRectangle
      : detectSolidRectangle(
          tiles,
          gridConfig.unitSize,
          gridConfig.xSize,
          gridConfig.ySize
        );

  // Automatic Celebration Engine for Freeform Geometric Area Model (delegated to App.tsx for factor mode)
  useEffect(() => {
    if (mode !== 'freeform' || !solidRectResult.isSolidRectangle || !solidRectResult.isValidTrinomialFactoring) {
      return;
    }

    // Must include all canvas tiles and have at least 3 tiles
    if (solidRectResult.tilesInRect.length !== tiles.length || tiles.length < 3) {
      return;
    }

    const currentKey = `${solidRectResult.fullEquationLatex}`;
    if (lastCelebratedEquationRef.current !== currentKey) {
      lastCelebratedEquationRef.current = currentKey;

      // Celebrate with cheerful chime and confetti burst!
      playSound('success');
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Log success in student learning record
      logStudentActivity({
        activityType: 'factoring_completed',
        question: customTarget?.rawString || solidRectResult.productBreakdown.simplifiedLatex,
        result: `${solidRectResult.factoredLatex} = ${solidRectResult.productBreakdown.simplifiedLatex}`,
        status: 'success',
      });
    }
  }, [solidRectResult, customTarget, mode, tiles.length]);

  // Calculate snap position for a tile coordinate
  const snapCoordinate = useCallback(
    (x: number, y: number, kind: TileKind, rotation: 0 | 90, ignoreTileId?: string) => {
      let snappedX = x;
      let snappedY = y;

      const dim = getTileDimensions(kind, rotation, gridConfig.unitSize, gridConfig.xSize, gridConfig.ySize);

      // Grid snap
      if (gridConfig.snapToGrid) {
        const u = gridConfig.unitSize;
        snappedX = Math.round(x / u) * u;
        snappedY = Math.round(y / u) * u;
      }

      // Magnetic edge-snapping: when dragging a tile near another tile (within 10px), snap bounding edges together
      const SNAP_THRESHOLD = 10;
      let bestSnapDeltaX = Infinity;
      let bestSnapCandidateX = snappedX;

      let bestSnapDeltaY = Infinity;
      let bestSnapCandidateY = snappedY;

      tiles.forEach((other) => {
        if (other.id === ignoreTileId) return;
        const otherDim = getTileDimensions(other.kind, other.rotation, gridConfig.unitSize, gridConfig.xSize, gridConfig.ySize);

        const otherLeft = other.x;
        const otherRight = other.x + otherDim.width;
        const otherTop = other.y;
        const otherBottom = other.y + otherDim.height;

        // Vertical overlap / proximity allowance for horizontal edge snapping
        const vOverlap = (snappedY + dim.height >= otherTop - SNAP_THRESHOLD) && (snappedY <= otherBottom + SNAP_THRESHOLD);

        if (vOverlap) {
          // 1. Snap dragged tile's left edge to other tile's right edge (adjacent side-by-side)
          const deltaLeftToRight = Math.abs(snappedX - otherRight);
          if (deltaLeftToRight <= SNAP_THRESHOLD && deltaLeftToRight < bestSnapDeltaX) {
            bestSnapDeltaX = deltaLeftToRight;
            bestSnapCandidateX = otherRight;
          }

          // 2. Snap dragged tile's right edge to other tile's left edge (adjacent side-by-side)
          const deltaRightToLeft = Math.abs((snappedX + dim.width) - otherLeft);
          if (deltaRightToLeft <= SNAP_THRESHOLD && deltaRightToLeft < bestSnapDeltaX) {
            bestSnapDeltaX = deltaRightToLeft;
            bestSnapCandidateX = otherLeft - dim.width;
          }

          // 3. Align left edges cleanly
          const deltaLeftAlign = Math.abs(snappedX - otherLeft);
          if (deltaLeftAlign <= SNAP_THRESHOLD && deltaLeftAlign < bestSnapDeltaX) {
            bestSnapDeltaX = deltaLeftAlign;
            bestSnapCandidateX = otherLeft;
          }

          // 4. Align right edges cleanly
          const deltaRightAlign = Math.abs((snappedX + dim.width) - otherRight);
          if (deltaRightAlign <= SNAP_THRESHOLD && deltaRightAlign < bestSnapDeltaX) {
            bestSnapDeltaX = deltaRightAlign;
            bestSnapCandidateX = otherRight - dim.width;
          }
        }

        // Horizontal overlap / proximity allowance for vertical edge snapping
        const hOverlap = (snappedX + dim.width >= otherLeft - SNAP_THRESHOLD) && (snappedX <= otherRight + SNAP_THRESHOLD);

        if (hOverlap) {
          // 1. Snap dragged tile's top edge to other tile's bottom edge (adjacent stacked)
          const deltaTopToBottom = Math.abs(snappedY - otherBottom);
          if (deltaTopToBottom <= SNAP_THRESHOLD && deltaTopToBottom < bestSnapDeltaY) {
            bestSnapDeltaY = deltaTopToBottom;
            bestSnapCandidateY = otherBottom;
          }

          // 2. Snap dragged tile's bottom edge to other tile's top edge (adjacent stacked)
          const deltaBottomToTop = Math.abs((snappedY + dim.height) - otherTop);
          if (deltaBottomToTop <= SNAP_THRESHOLD && deltaBottomToTop < bestSnapDeltaY) {
            bestSnapDeltaY = deltaBottomToTop;
            bestSnapCandidateY = otherTop - dim.height;
          }

          // 3. Align top edges cleanly
          const deltaTopAlign = Math.abs(snappedY - otherTop);
          if (deltaTopAlign <= SNAP_THRESHOLD && deltaTopAlign < bestSnapDeltaY) {
            bestSnapDeltaY = deltaTopAlign;
            bestSnapCandidateY = otherTop;
          }

          // 4. Align bottom edges cleanly
          const deltaBottomAlign = Math.abs((snappedY + dim.height) - otherBottom);
          if (deltaBottomAlign <= SNAP_THRESHOLD && deltaBottomAlign < bestSnapDeltaY) {
            bestSnapDeltaY = deltaBottomAlign;
            bestSnapCandidateY = otherBottom - dim.height;
          }
        }
      });

      if (bestSnapDeltaX <= SNAP_THRESHOLD) {
        snappedX = bestSnapCandidateX;
      }
      if (bestSnapDeltaY <= SNAP_THRESHOLD) {
        snappedY = bestSnapCandidateY;
      }

      return { x: snappedX, y: snappedY };
    },
    [gridConfig, tiles]
  );

  // Screen to Canvas coordinate conversion
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: clientX, y: clientY };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - viewTransform.x) / viewTransform.scale,
        y: (clientY - rect.top - viewTransform.y) / viewTransform.scale,
      };
    },
    [viewTransform]
  );

  // Tile Drag Start handler
  const handleTilePointerDown = (e: React.PointerEvent, tileId: string) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // If 2 or more touches active, switch to multi-touch pinch/pan mode
    if (activePointersRef.current.size >= 2) {
      isDraggingRef.current = false;
      dragTileIdRef.current = null;
      setSelectionBox(null);

      const touches: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const p1 = touches[0];
      const p2 = touches[1];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      pinchStateRef.current = {
        initialDistance: Math.max(10, dist),
        initialMidpoint: { x: midX, y: midY },
        initialScale: viewTransform.scale,
        initialViewX: viewTransform.x,
        initialViewY: viewTransform.y,
      };
      return;
    }

    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    isDraggingRef.current = true;
    dragTileIdRef.current = tileId;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    dragStartPosRef.current = canvasPos;

    // Handle selection: if clicking an unselected tile without shift/ctrl, select only this tile
    let newSelected = new Set(selectedTileIds);
    if (!e.shiftKey && !e.ctrlKey && !selectedTileIds.has(tileId)) {
      newSelected = new Set([tileId]);
      setSelectedTileIds(newSelected);
    } else if (e.shiftKey || e.ctrlKey) {
      if (newSelected.has(tileId)) newSelected.delete(tileId);
      else newSelected.add(tileId);
      setSelectedTileIds(newSelected);
    }

    // Save initial positions of all dragged tiles
    const initialPos = new Map<string, { x: number; y: number }>();
    tiles.forEach((t) => {
      if (newSelected.has(t.id) || t.id === tileId) {
        initialPos.set(t.id, { x: t.x, y: t.y });
      }
    });
    initialTilePositionsRef.current = initialPos;
    playSound('pickup');
  };

  // Canvas background pointer down (selection box, pan, or multi-touch start)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch initialization (2 fingers)
    if (activePointersRef.current.size === 2) {
      isDraggingRef.current = false;
      dragTileIdRef.current = null;
      setSelectionBox(null);

      const touches: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const p1 = touches[0];
      const p2 = touches[1];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      pinchStateRef.current = {
        initialDistance: Math.max(10, dist),
        initialMidpoint: { x: midX, y: midY },
        initialScale: viewTransform.scale,
        initialViewX: viewTransform.x,
        initialViewY: viewTransform.y,
      };
      return;
    }

    // Single finger or mouse pan with middle click / Alt key
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        viewX: viewTransform.x,
        viewY: viewTransform.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Otherwise clear selection and start box marquee
    if (!e.shiftKey) {
      setSelectedTileIds(new Set());
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setSelectionBox({
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Pointer Move (handles 2-finger pinch/pan, single-finger tile drag, marquee box)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 1. Two-Finger Pinch-to-Zoom & Pan handling
    if (activePointersRef.current.size >= 2 && pinchStateRef.current && containerRef.current) {
      const touches: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const p1 = touches[0];
      const p2 = touches[1];
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const currentMidX = (p1.x + p2.x) / 2;
      const currentMidY = (p1.y + p2.y) / 2;

      const rect = containerRef.current.getBoundingClientRect();
      const scaleRatio = currentDist / pinchStateRef.current.initialDistance;
      const newScale = Math.max(0.5, Math.min(2.5, pinchStateRef.current.initialScale * scaleRatio));

      // Focal point in canvas coordinates at initial midpoint
      const focalX =
        (pinchStateRef.current.initialMidpoint.x - rect.left - pinchStateRef.current.initialViewX) /
        pinchStateRef.current.initialScale;
      const focalY =
        (pinchStateRef.current.initialMidpoint.y - rect.top - pinchStateRef.current.initialViewY) /
        pinchStateRef.current.initialScale;

      const newViewX = currentMidX - rect.left - focalX * newScale;
      const newViewY = currentMidY - rect.top - focalY * newScale;

      setViewTransform({
        x: newViewX,
        y: newViewY,
        scale: newScale,
      });
      return;
    }

    // 2. Single-Pointer Mouse/Touch Pan (Middle click / Alt)
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewTransform((prev) => ({
        ...prev,
        x: panStartRef.current.viewX + dx,
        y: panStartRef.current.viewY + dy,
      }));
      return;
    }

    // 3. Marquee selection box update
    if (selectionBox) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox((prev) => (prev ? { ...prev, currentX: canvasPos.x, currentY: canvasPos.y } : null));

      const minX = Math.min(selectionBox.startX, canvasPos.x);
      const maxX = Math.max(selectionBox.startX, canvasPos.x);
      const minY = Math.min(selectionBox.startY, canvasPos.y);
      const maxY = Math.max(selectionBox.startY, canvasPos.y);

      const newlySelected = new Set<string>(e.shiftKey ? selectedTileIds : []);
      tiles.forEach((tile) => {
        const dim = getTileDimensions(tile.kind, tile.rotation);
        const tileRight = tile.x + dim.width;
        const tileBottom = tile.y + dim.height;

        if (tile.x < maxX && tileRight > minX && tile.y < maxY && tileBottom > minY) {
          newlySelected.add(tile.id);
        }
      });
      setSelectedTileIds(newlySelected);
      return;
    }

    // 4. Dragging tile(s) (Single Finger / Left Click)
    if (isDraggingRef.current && dragTileIdRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const dx = canvasPos.x - dragStartPosRef.current.x;
      const dy = canvasPos.y - dragStartPosRef.current.y;

      const mainTileInit = initialTilePositionsRef.current.get(dragTileIdRef.current);
      if (!mainTileInit) return;

      const targetTile = tiles.find((t) => t.id === dragTileIdRef.current);
      if (!targetTile) return;

      const rawX = mainTileInit.x + dx;
      const rawY = mainTileInit.y + dy;

      const snapped = snapCoordinate(rawX, rawY, targetTile.kind, targetTile.rotation, targetTile.id);
      const effectiveDx = snapped.x - mainTileInit.x;
      const effectiveDy = snapped.y - mainTileInit.y;

      setTiles((prev) =>
        prev.map((t) => {
          const init = initialTilePositionsRef.current.get(t.id);
          if (init) {
            let zone: 'left' | 'right' | 'top_factor' | 'left_factor' | 'product_area' | 'main' = 'main';

            if (mode === 'equation') {
              const canvasMidX = (containerRef.current?.clientWidth || 800) / 2;
              zone = (init.x + effectiveDx) < canvasMidX ? 'left' : 'right';
            } else if (mode === 'factor') {
              const finalX = init.x + effectiveDx;
              const finalY = init.y + effectiveDy;
              if (finalY < 160 && finalX >= 160) {
                zone = 'top_factor';
              } else if (finalX < 180 && finalY >= 140) {
                zone = 'left_factor';
              } else if (finalX >= 180 && finalY >= 160) {
                zone = 'product_area';
              } else {
                zone = 'main';
              }
            }

            return {
              ...t,
              x: Math.max(0, init.x + effectiveDx),
              y: Math.max(0, init.y + effectiveDy),
              zone,
            };
          }
          return t;
        })
      );
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);

    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
    }

    if (selectionBox) {
      setSelectionBox(null);
    }

    if (isDraggingRef.current) {
      const droppedTileId = dragTileIdRef.current;
      isDraggingRef.current = false;
      dragTileIdRef.current = null;
      initialTilePositionsRef.current.clear();
      playSound('drop');
      onTilesChange(tiles);

      // Core Zero-Pair Cancellation on drop with >50% overlap
      if (droppedTileId) {
        const droppedTile = tiles.find((t) => t.id === droppedTileId);
        if (droppedTile) {
          const dim1 = getTileDimensions(
            droppedTile.kind,
            droppedTile.rotation,
            gridConfig.unitSize,
            gridConfig.xSize,
            gridConfig.ySize
          );
          const x1 = droppedTile.x;
          const y1 = droppedTile.y;
          const w1 = dim1.width;
          const h1 = dim1.height;
          const area1 = w1 * h1;

          let bestPairTile: TileData | null = null;
          let maxOverlapRatio = 0;

          tiles.forEach((other) => {
            if (other.id === droppedTile.id) return;
            if (other.kind !== droppedTile.kind) return;
            if (other.sign !== -droppedTile.sign) return;

            const dim2 = getTileDimensions(
              other.kind,
              other.rotation,
              gridConfig.unitSize,
              gridConfig.xSize,
              gridConfig.ySize
            );
            const x2 = other.x;
            const y2 = other.y;
            const w2 = dim2.width;
            const h2 = dim2.height;

            const interLeft = Math.max(x1, x2);
            const interRight = Math.min(x1 + w1, x2 + w2);
            const interTop = Math.max(y1, y2);
            const interBottom = Math.min(y1 + h1, y2 + h2);

            const interW = Math.max(0, interRight - interLeft);
            const interH = Math.max(0, interBottom - interTop);
            const interArea = interW * interH;
            const area2 = w2 * h2;
            const minArea = Math.min(area1, area2);

            const overlapRatio = minArea > 0 ? interArea / minArea : 0;

            if (overlapRatio > 0.5 && overlapRatio > maxOverlapRatio) {
              maxOverlapRatio = overlapRatio;
              bestPairTile = other;
            }
          });

          if (bestPairTile) {
            const partner: TileData = bestPairTile;
            const pairIds = [droppedTile.id, partner.id];

            setDissolvingTileIds((prev) => new Set([...prev, ...pairIds]));
            playSound('zeropair');

            const kindName =
              droppedTile.kind === 'unit'
                ? '1'
                : droppedTile.kind === 'x2'
                ? 'x²'
                : droppedTile.kind === 'y2'
                ? 'y²'
                : droppedTile.kind;
            const label = `${droppedTile.sign > 0 ? '+' : '-'}${kindName} + ${
              partner.sign > 0 ? '+' : '-'
            }${kindName} = 0`;

            setZeroPairBurst({
              id: `burst-${Date.now()}`,
              x: (x1 + partner.x) / 2 + w1 / 2,
              y: (y1 + partner.y) / 2 + h1 / 2,
              label,
            });

            setTimeout(() => {
              setTiles((prev) => {
                const updated = prev.filter((t) => t.id !== droppedTile.id && t.id !== partner.id);
                onTilesChange(updated);
                return updated;
              });
              setDissolvingTileIds((prev) => {
                const next = new Set(prev);
                next.delete(droppedTile.id);
                next.delete(partner.id);
                return next;
              });
              setZeroPairBurst(null);
            }, 320);
          }
        }
      }
    }
  };

  // Wheel Zoom (Trackpad pinch & desktop wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newScale = Math.max(0.5, Math.min(2.5, viewTransform.scale * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - viewTransform.x) * (newScale / viewTransform.scale);
      const newY = mouseY - (mouseY - viewTransform.y) * (newScale / viewTransform.scale);

      setViewTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  // Selected Tiles Actions
  const handleRotateSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    playSound('flip');
    const updated = tiles.map((t) => {
      if (selectedTileIds.has(t.id)) {
        return { ...t, rotation: (t.rotation === 0 ? 90 : 0) as 0 | 90 };
      }
      return t;
    });
    setTiles(updated);
    onTilesChange(updated);
  }, [selectedTileIds, tiles, setTiles, onTilesChange]);

  const handleFlipSignSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    playSound('flip');
    const updated = tiles.map((t) => {
      if (selectedTileIds.has(t.id)) {
        return { ...t, sign: (t.sign === 1 ? -1 : 1) as TileSign };
      }
      return t;
    });
    setTiles(updated);
    onTilesChange(updated);
  }, [selectedTileIds, tiles, setTiles, onTilesChange]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    playSound('pickup');
    const newTiles: TileData[] = [];
    const newSelectedIds = new Set<string>();

    tiles.forEach((t) => {
      if (selectedTileIds.has(t.id)) {
        const id = `tile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        newTiles.push({
          ...t,
          id,
          x: t.x + 28,
          y: t.y + 28,
        });
        newSelectedIds.add(id);
      }
    });

    const updated = [...tiles, ...newTiles];
    setTiles(updated);
    setSelectedTileIds(newSelectedIds);
    onTilesChange(updated);
  }, [selectedTileIds, tiles, setTiles, onTilesChange]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedTileIds.size === 0) return;
    playSound('clear');
    const updated = tiles.filter((t) => !selectedTileIds.has(t.id));
    setTiles(updated);
    setSelectedTileIds(new Set());
    onTilesChange(updated);
  }, [selectedTileIds, tiles, setTiles, onTilesChange]);

  const handleFlipSign = (tileId: string) => {
    playSound('flip');
    const updated = tiles.map((t) => (t.id === tileId ? { ...t, sign: (t.sign === 1 ? -1 : 1) as TileSign } : t));
    setTiles(updated);
    onTilesChange(updated);
  };

  const handleRotate = (tileId: string) => {
    playSound('flip');
    const updated = tiles.map((t) => (t.id === tileId ? { ...t, rotation: (t.rotation === 0 ? 90 : 0) as 0 | 90 } : t));
    setTiles(updated);
    onTilesChange(updated);
  };

  const handleDelete = (tileId: string) => {
    playSound('clear');
    const updated = tiles.filter((t) => t.id !== tileId);
    setTiles(updated);
    setSelectedTileIds((prev) => {
      const next = new Set(prev);
      next.delete(tileId);
      return next;
    });
    onTilesChange(updated);
  };

  const handleDuplicate = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return;
    playSound('pickup');
    const newTile: TileData = {
      ...tile,
      id: `tile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: tile.x + 30,
      y: tile.y + 30,
    };
    const updated = [...tiles, newTile];
    setTiles(updated);
    setSelectedTileIds(new Set([newTile.id]));
    onTilesChange(updated);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTileIds.size > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key.toLowerCase() === 'f') {
        if (selectedTileIds.size > 0) {
          e.preventDefault();
          handleFlipSignSelected();
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (selectedTileIds.size > 0) {
          e.preventDefault();
          handleRotateSelected();
        }
      } else if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) {
        if (selectedTileIds.size > 0) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      } else if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedTileIds(new Set(tiles.map((t) => t.id)));
      } else if (e.key === 'Escape') {
        setSelectedTileIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    tiles,
    selectedTileIds,
    handleDeleteSelected,
    handleFlipSignSelected,
    handleRotateSelected,
    handleDuplicateSelected,
  ]);

  return (
    <div
      ref={containerRef}
      id="workspace-canvas-viewport"
      className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 select-none touch-none cursor-crosshair"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Background Grid Pattern */}
      {gridConfig.showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: `${gridConfig.unitSize}px ${gridConfig.unitSize}px`,
            backgroundPosition: `${viewTransform.x}px ${viewTransform.y}px`,
          }}
        />
      )}

      {/* Mode Special Overlays */}

      {/* 1. EQUATION BALANCE MAT OVERLAY */}
      {mode === 'equation' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {/* Top Bar Header */}
          <div className="h-10 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 z-0">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Left Side Expression</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-950/80 text-cyan-300 font-mono font-bold text-sm px-3 py-0.5 rounded-full border border-cyan-700/50">
              =
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Right Side Expression</span>
            </div>
          </div>

          {/* Center Divider & Balance Fulcrum */}
          <div className="relative flex-1 flex">
            <div className="flex-1 bg-cyan-950/5 border-r-2 border-dashed border-slate-700/60" />
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center text-slate-300 font-bold text-xl shadow-2xl">
                =
              </div>
            </div>
            <div className="flex-1 bg-amber-950/5" />
          </div>
        </div>
      )}

      {/* Transformed Canvas Container for Tiles & Glowing Dimension Brackets */}
      <div
        id="canvas-transformed-plane"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* DEDICATED TOP & LEFT FACTOR TRACKS (Exact layout from Screenshot 2) */}
        {mode === 'factor' && (
          <div className="absolute pointer-events-none z-0">
            {/* Top-Left Corner Box */}
            <div
              className="absolute border-r-2 border-b-2 border-dashed border-cyan-500/40 bg-slate-900/30 p-3.5 flex flex-col justify-center select-none"
              style={{
                left: 0,
                top: 0,
                width: '180px',
                height: '160px',
              }}
            >
              <div className="text-xs font-bold text-slate-300">Factor Track Corner</div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight mt-1">
                Product Area (Right & Below)
              </div>
            </div>

            {/* Top Factor Track (Width Dimension) */}
            <div
              className="absolute border-b-2 border-dashed border-cyan-500/40 bg-cyan-950/10 px-4 py-2.5 flex flex-col justify-start select-none"
              style={{
                left: '180px',
                top: 0,
                width: '2400px',
                height: '160px',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                  TOP DIMENSION / FACTOR 1 (WIDTH)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Place x bars and unit tiles horizontally here
              </span>
            </div>

            {/* Left Factor Track (Height Dimension) */}
            <div
              className="absolute border-r-2 border-dashed border-teal-500/40 bg-teal-950/10 px-3 py-3 flex flex-col justify-start select-none"
              style={{
                left: 0,
                top: '160px',
                width: '180px',
                height: '2000px',
              }}
            >
              <div className="text-xs font-black text-teal-400 uppercase tracking-wider">
                LEFT FACTOR 2
              </div>
              <span className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Height dimension
              </span>
            </div>

            {/* Vertical Guide Line Extension */}
            <div
              className="absolute w-0 border-r-2 border-dashed border-cyan-500/40"
              style={{
                left: '180px',
                top: '160px',
                height: '2000px',
              }}
            />

            {/* Horizontal Guide Line Extension */}
            <div
              className="absolute h-0 border-b-2 border-dashed border-cyan-500/40"
              style={{
                left: '180px',
                top: '160px',
                width: '2400px',
              }}
            />
          </div>
        )}

        {/* Glowing Dimension Brackets & Factoring Validation Celebration Overlay */}
        {solidRectResult.isSolidRectangle && solidRectResult.tilesInRect.length > 0 && (
          <div className="absolute pointer-events-none z-20 transition-all duration-300">
            {/* 1. Rectangle Outer Glow Perimeter */}
            <div
              className={`absolute border-2 rounded-lg transition-all ${
                mode === 'factor' && factoringModel.isValidFactorization
                  ? 'border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.7)] bg-emerald-500/10 animate-pulse'
                  : 'border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] bg-emerald-500/5'
              }`}
              style={{
                left: `${solidRectResult.bounds.minX - 4}px`,
                top: `${solidRectResult.bounds.minY - 4}px`,
                width: `${solidRectResult.bounds.width + 8}px`,
                height: `${solidRectResult.bounds.height + 8}px`,
              }}
            />

            {/* 2. TOP GLOWING DIMENSION BRACKET (Width Factor) */}
            <div
              className="absolute flex flex-col items-center pointer-events-auto"
              style={{
                left: `${solidRectResult.bounds.minX}px`,
                top: `${solidRectResult.bounds.minY - 46}px`,
                width: `${solidRectResult.bounds.width}px`,
              }}
            >
              {/* Width Factor Badge */}
              <div className="bg-emerald-950/95 border-2 border-emerald-400 text-emerald-300 font-mono font-black text-xs sm:text-sm px-3 py-0.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Width:</span>
                <span>{solidRectResult.topDimension.label || 'x'}</span>
              </div>
              {/* Horizontal Bracket Bar & End Ticks */}
              <div className="w-full h-2.5 flex items-center relative mt-1">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full" />
                <div className="w-full h-0.5 bg-emerald-400/90 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-emerald-400 rounded-full" />
              </div>
            </div>

            {/* 3. LEFT GLOWING DIMENSION BRACKET (Height Factor) */}
            <div
              className="absolute flex flex-row items-center pointer-events-auto"
              style={{
                left: `${solidRectResult.bounds.minX - 58}px`,
                top: `${solidRectResult.bounds.minY}px`,
                height: `${solidRectResult.bounds.height}px`,
              }}
            >
              {/* Height Factor Badge */}
              <div className="bg-blue-950/95 border-2 border-blue-400 text-blue-300 font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center gap-1 whitespace-nowrap -rotate-90 origin-center">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Height:</span>
                <span>{solidRectResult.leftDimension.label || 'x'}</span>
              </div>
              {/* Vertical Bracket Bar & End Ticks */}
              <div className="h-full w-2.5 flex flex-col justify-center relative ml-1">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
                <div className="h-full w-0.5 bg-blue-400/90 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
              </div>
            </div>

            {/* 4. Factored Equation Victory Pill */}
            {((mode === 'factor' && factoringModel.isValidFactorization) || (mode !== 'factor' && solidRectResult.isValidTrinomialFactoring)) && (
              <div
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-emerald-400 text-emerald-200 px-4 py-1.5 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center gap-2 text-xs sm:text-sm font-black whitespace-nowrap z-30 pointer-events-auto animate-bounce"
                style={{
                  left: `${solidRectResult.bounds.minX + solidRectResult.bounds.width / 2}px`,
                  top: `${solidRectResult.bounds.maxY + 14}px`,
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Factored: {mode === 'factor' ? factoringModel.fullEquationLatex : solidRectResult.fullEquationLatex}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Render Tiles */}
        {tiles.map((tile) => (
          <TileItem
            key={tile.id}
            tile={tile}
            isSelected={selectedTileIds.has(tile.id)}
            isZeroPaired={zeroPairTileIds.has(tile.id)}
            isDissolving={dissolvingTileIds.has(tile.id)}
            onPointerDown={handleTilePointerDown}
            onFlipSign={handleFlipSign}
            onRotate={handleRotate}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        ))}

        {/* Zero Pair Dissolve / Poof Notification Particles */}
        {zeroPairBurst && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center animate-bounce"
            style={{ left: `${zeroPairBurst.x}px`, top: `${zeroPairBurst.y}px` }}
          >
            <div className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-lg border border-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-900" />
              <span>Zero-Pair Cancelled!</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-200 mt-0.5 drop-shadow">
              {zeroPairBurst.label}
            </span>
          </div>
        )}

        {/* Marquee Selection Box */}
        {selectionBox && (
          <div
            className="absolute border border-cyan-400 bg-cyan-500/15 pointer-events-none rounded-sm z-40"
            style={{
              left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
              top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
              width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
              height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
            }}
          />
        )}
      </div>

      {/* Zero Pair Floating Cancel Notification / Pill */}
      {zeroPairs.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-500/60 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-200">
            {zeroPairs.length} Zero Pair{zeroPairs.length > 1 ? 's' : ''} detected!
          </span>
          <button
            id="cancel-zero-pairs-toast-btn"
            type="button"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-full transition-all shadow-md"
            onClick={() => {
              onCancelAllZeroPairs();
            }}
          >
            Cancel All (Vaporize)
          </button>
        </div>
      )}

      {/* Floating Canvas View Controls (Zoom In/Out, Reset) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-2xl shadow-xl z-30">
        <button
          id="canvas-zoom-in-btn"
          type="button"
          title="Zoom In"
          className="min-h-[44px] min-w-[44px] p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center active:scale-95"
          onClick={() => setViewTransform((v) => ({ ...v, scale: Math.min(2.5, v.scale + 0.15) }))}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          id="canvas-zoom-out-btn"
          type="button"
          title="Zoom Out"
          className="min-h-[44px] min-w-[44px] p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center active:scale-95"
          onClick={() => setViewTransform((v) => ({ ...v, scale: Math.max(0.5, v.scale - 0.15) }))}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          id="canvas-reset-view-btn"
          type="button"
          title="Reset View Position (100%)"
          className="min-h-[44px] min-w-[44px] p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center active:scale-95"
          onClick={() => setViewTransform({ x: 0, y: 0, scale: 1 })}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Action Bar for Selected Tile(s) - 44px Touch Targets */}
      {selectedTileIds.size > 0 && (
        <div className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500/50 backdrop-blur-xl px-2 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-2 z-40 max-w-[94vw] overflow-x-auto">
          {/* Selected Count Indicator Badge */}
          <div className="px-2.5 py-1.5 bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              {selectedTileIds.size} <span className="hidden sm:inline">Tile{selectedTileIds.size > 1 ? 's' : ''}</span>
            </span>
          </div>

          {/* 1. Rotate 90° Button */}
          <button
            id="floating-rotate-btn"
            type="button"
            title="Rotate 90° (R)"
            className="min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-emerald-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            onClick={handleRotateSelected}
          >
            <RotateCw className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Rotate 90°</span>
          </button>

          {/* 2. Flip Sign (+ ↔ -) Button */}
          <button
            id="floating-flip-btn"
            type="button"
            title="Flip Sign + ↔ - (F)"
            className="min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            onClick={handleFlipSignSelected}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Flip Sign</span>
          </button>

          {/* 3. Duplicate Button */}
          <button
            id="floating-duplicate-btn"
            type="button"
            title="Duplicate Tile(s) (Ctrl+D)"
            className="min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-blue-300 border border-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            onClick={handleDuplicateSelected}
          >
            <Copy className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Duplicate</span>
          </button>

          {/* 4. Delete Button */}
          <button
            id="floating-delete-btn"
            type="button"
            title="Delete Selected (Del / Backspace)"
            className="min-h-[44px] min-w-[44px] px-3 py-2 bg-red-950/90 hover:bg-red-900 active:bg-red-800 text-red-300 border border-red-800 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="hidden md:inline">Delete</span>
          </button>

          {/* Deselect Close Button */}
          <button
            id="floating-deselect-btn"
            type="button"
            title="Deselect All (Esc)"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center active:scale-95"
            onClick={() => setSelectedTileIds(new Set())}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
