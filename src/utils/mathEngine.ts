import { TileData, TileKind, ExpressionBreakdown, ZeroPairCandidate, SolidRectangleResult } from '../types';
import { BASE_UNIT, X_UNIT, Y_UNIT, getTileDimensions } from './constants';

export const computeExpressionBreakdown = (tiles: TileData[]): ExpressionBreakdown => {
  let x2 = 0;
  let y2 = 0;
  let xy = 0;
  let x = 0;
  let y = 0;
  let unit = 0;

  let posCount = 0;
  let negCount = 0;

  tiles.forEach((t) => {
    if (t.sign > 0) posCount++;
    else negCount++;

    switch (t.kind) {
      case 'x2':
        x2 += t.sign;
        break;
      case 'y2':
        y2 += t.sign;
        break;
      case 'xy':
        xy += t.sign;
        break;
      case 'x':
        x += t.sign;
        break;
      case 'y':
        y += t.sign;
        break;
      case 'unit':
        unit += t.sign;
        break;
    }
  });

  const terms: string[] = [];

  const formatTerm = (coeff: number, symbol: string) => {
    if (coeff === 0) return;
    const isFirst = terms.length === 0;
    const signStr = coeff > 0 ? (isFirst ? '' : '+ ') : '- ';
    const absCoeff = Math.abs(coeff);
    const coeffStr = symbol === '' ? `${absCoeff}` : absCoeff === 1 ? '' : `${absCoeff}`;
    terms.push(`${signStr}${coeffStr}${symbol}`.trim());
  };

  formatTerm(x2, 'x^2');
  formatTerm(xy, 'xy');
  formatTerm(y2, 'y^2');
  formatTerm(x, 'x');
  formatTerm(y, 'y');
  formatTerm(unit, '');

  const simplifiedLatex = terms.length > 0 ? terms.join(' ') : '0';

  // Build raw unsimplified polynomial
  const rawTerms: string[] = [];
  tiles.forEach((t) => {
    const isFirst = rawTerms.length === 0;
    const sym = t.kind === 'x2' ? 'x^2' : t.kind === 'y2' ? 'y^2' : t.kind === 'xy' ? 'xy' : t.kind === 'x' ? 'x' : t.kind === 'y' ? 'y' : '1';
    if (t.sign > 0) {
      rawTerms.push(isFirst ? sym : `+ ${sym}`);
    } else {
      rawTerms.push(`- ${sym}`);
    }
  });

  const expandedPolynomial = rawTerms.length > 0 ? rawTerms.join(' ') : '0';

  return {
    x2,
    y2,
    xy,
    x,
    y,
    unit,
    rawCount: {
      positive: posCount,
      negative: negCount,
    },
    latex: simplifiedLatex,
    simplifiedLatex,
    expandedPolynomial,
  };
};

export const evaluateExpression = (
  breakdown: ExpressionBreakdown,
  xVal: number = 2,
  yVal: number = 3
): number => {
  return (
    breakdown.x2 * Math.pow(xVal, 2) +
    breakdown.y2 * Math.pow(yVal, 2) +
    breakdown.xy * (xVal * yVal) +
    breakdown.x * xVal +
    breakdown.y * yVal +
    breakdown.unit
  );
};

export const findZeroPairs = (tiles: TileData[], proximityThreshold: number = 70): ZeroPairCandidate[] => {
  const candidates: ZeroPairCandidate[] = [];
  const matched = new Set<string>();

  // Group by kind
  const kinds: TileKind[] = ['unit', 'x', 'y', 'x2', 'y2', 'xy'];

  kinds.forEach((kind) => {
    const posTiles = tiles.filter((t) => t.kind === kind && t.sign > 0 && !matched.has(t.id));
    const negTiles = tiles.filter((t) => t.kind === kind && t.sign < 0 && !matched.has(t.id));

    // Find closest pairs
    posTiles.forEach((pos) => {
      let closestNeg: TileData | null = null;
      let minDistance = Infinity;

      negTiles.forEach((neg) => {
        if (matched.has(neg.id)) return;
        // Same zone (e.g. left vs right)
        if (pos.zone && neg.zone && pos.zone !== neg.zone) return;

        const dist = Math.hypot(pos.x - neg.x, pos.y - neg.y);
        if (dist < minDistance && dist <= proximityThreshold) {
          minDistance = dist;
          closestNeg = neg;
        }
      });

      if (closestNeg) {
        candidates.push({
          tile1Id: pos.id,
          tile2Id: (closestNeg as TileData).id,
          kind,
        });
        matched.add(pos.id);
        matched.add((closestNeg as TileData).id);
      }
    });
  });

  return candidates;
};

// Auto organize tiles neatly into standard algebraic layout
export const organizeTilesInStandardOrder = (
  tiles: TileData[],
  startX: number = 40,
  startY: number = 40,
  maxWidth: number = 600
): TileData[] => {
  const order: TileKind[] = ['x2', 'xy', 'y2', 'x', 'y', 'unit'];
  
  // Sort tiles by kind order, then positive first, then negative
  const sorted = [...tiles].sort((a, b) => {
    const kindA = order.indexOf(a.kind);
    const kindB = order.indexOf(b.kind);
    if (kindA !== kindB) return kindA - kindB;
    return b.sign - a.sign; // +1 first, then -1
  });

  let curX = startX;
  let curY = startY;
  let rowMaxHeight = 0;
  const GAP = 12;

  return sorted.map((tile) => {
    const dim = getTileDimensions(tile.kind, tile.rotation);
    if (curX + dim.width > startX + maxWidth && curX > startX) {
      curX = startX;
      curY += rowMaxHeight + GAP;
      rowMaxHeight = 0;
    }

    const newTile: TileData = {
      ...tile,
      x: curX,
      y: curY,
    };

    curX += dim.width + GAP;
    if (dim.height > rowMaxHeight) {
      rowMaxHeight = dim.height;
    }

    return newTile;
  });
};

/**
 * Bounding Rectangle Detector:
 * Scans a set of tiles and strictly determines if they form a continuous, solid geometric rectangle
 * with no gaps and no overlapping tiles. Computes exact algebraic dimensions (ax + b) and (cx + d).
 */
export const detectSolidRectangle = (
  tiles: TileData[],
  unitSize: number = BASE_UNIT,
  xSize: number = X_UNIT,
  ySize: number = Y_UNIT
): SolidRectangleResult => {
  const emptyResult: SolidRectangleResult = {
    isSolidRectangle: false,
    tilesInRect: [],
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 },
    topDimension: { xCount: 0, unitCount: 0, label: '', latex: '' },
    leftDimension: { xCount: 0, unitCount: 0, label: '', latex: '' },
    productBreakdown: computeExpressionBreakdown([]),
    factoredLatex: '',
    fullEquationLatex: '',
    isValidTrinomialFactoring: false,
  };

  if (tiles.length === 0) return emptyResult;

  // Calculate geometric bounding box of all tiles
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let totalTileArea = 0;

  const tileRects = tiles.map((t) => {
    const dim = getTileDimensions(t.kind, t.rotation, unitSize, xSize, ySize);
    const x1 = Math.round(t.x);
    const y1 = Math.round(t.y);
    const x2 = x1 + dim.width;
    const y2 = y1 + dim.height;
    const area = dim.width * dim.height;

    minX = Math.min(minX, x1);
    maxX = Math.max(maxX, x2);
    minY = Math.min(minY, y1);
    maxY = Math.max(maxY, y2);
    totalTileArea += area;

    return {
      tile: t,
      x1,
      y1,
      x2,
      y2,
      w: dim.width,
      h: dim.height,
      area,
    };
  });

  const boundingWidth = maxX - minX;
  const boundingHeight = maxY - minY;
  const boundingArea = boundingWidth * boundingHeight;

  if (boundingWidth <= 0 || boundingHeight <= 0) return emptyResult;

  // 1. Area Test: Total sum of tile areas must closely equal bounding box area
  const areaTolerance = Math.max(300, tiles.length * (unitSize * 4));
  const areaDifference = Math.abs(totalTileArea - boundingArea);
  const isAreaFilled = areaDifference <= areaTolerance;

  if (!isAreaFilled) {
    return {
      ...emptyResult,
      bounds: { minX, maxX, minY, maxY, width: boundingWidth, height: boundingHeight },
    };
  }

  // 2. Overlap Test: Ensure tiles are not stacked on top of each other
  for (let i = 0; i < tileRects.length; i++) {
    for (let j = i + 1; j < tileRects.length; j++) {
      const r1 = tileRects[i];
      const r2 = tileRects[j];
      const interLeft = Math.max(r1.x1, r2.x1);
      const interRight = Math.min(r1.x2, r2.x2);
      const interTop = Math.max(r1.y1, r2.y1);
      const interBottom = Math.min(r1.y2, r2.y2);

      const interW = Math.max(0, interRight - interLeft);
      const interH = Math.max(0, interBottom - interTop);
      const interArea = interW * interH;

      // Only reject if there is a substantial 2D collision overlap in both width and height
      if (interW > 8 && interH > 8 && interArea > 80) {
        return {
          ...emptyResult,
          bounds: { minX, maxX, minY, maxY, width: boundingWidth, height: boundingHeight },
        };
      }
    }
  }

  // 3. Mathematical Factor Decomposition from Bounding Geometry & Polynomial Terms
  const productBreakdown = computeExpressionBreakdown(tiles);

  let bestTopX = 0;
  let bestTopUnit = 0;
  let bestLeftX = 0;
  let bestLeftUnit = 0;
  let foundValidFit = false;

  // 3a. Direct Edge Analysis: Compute dimensions directly from physical edge composition
  const topEdgeTiles = tileRects
    .filter((r) => Math.abs(r.y1 - minY) <= 15)
    .sort((a, b) => a.x1 - b.x1);

  let edgeTopX = 0;
  let edgeTopUnit = 0;
  topEdgeTiles.forEach((r) => {
    const t = r.tile;
    if (t.kind === 'x2') {
      edgeTopX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 0) {
      edgeTopX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 90) {
      edgeTopUnit += t.sign;
    } else if (t.kind === 'unit') {
      edgeTopUnit += t.sign;
    }
  });

  const leftEdgeTiles = tileRects
    .filter((r) => Math.abs(r.x1 - minX) <= 15)
    .sort((a, b) => a.y1 - b.y1);

  let edgeLeftX = 0;
  let edgeLeftUnit = 0;
  leftEdgeTiles.forEach((r) => {
    const t = r.tile;
    if (t.kind === 'x2') {
      edgeLeftX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 90) {
      edgeLeftX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 0) {
      edgeLeftUnit += t.sign;
    } else if (t.kind === 'unit') {
      edgeLeftUnit += t.sign;
    }
  });

  // Verify if physical edge dimensions multiply to match the polynomial
  const edgeProdX2 = edgeTopX * edgeLeftX;
  const edgeProdX = edgeTopX * edgeLeftUnit + edgeTopUnit * edgeLeftX;
  const edgeProdUnit = edgeTopUnit * edgeLeftUnit;

  if (
    (edgeTopX !== 0 || edgeTopUnit !== 0) &&
    (edgeLeftX !== 0 || edgeLeftUnit !== 0) &&
    edgeProdX2 === productBreakdown.x2 &&
    edgeProdX === productBreakdown.x &&
    edgeProdUnit === productBreakdown.unit
  ) {
    bestTopX = edgeTopX;
    bestTopUnit = edgeTopUnit;
    bestLeftX = edgeLeftX;
    bestLeftUnit = edgeLeftUnit;
    foundValidFit = true;
  }

  // 3b. Solver fallback: Prioritize standard positive curriculum factors (a >= 0, c >= 0)
  if (!foundValidFit) {
    const aList = productBreakdown.x2 < 0 ? [-1, -2, -3, 1, 2, 3] : [1, 2, 3, 4, 0];
    const cList = productBreakdown.x2 < 0 ? [1, 2, 3, -1, -2, -3] : [1, 2, 3, 4, 0];
    const bList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12];
    const dList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12];

    for (const a of aList) {
      for (const b of bList) {
        if (a === 0 && b === 0) continue;
        const expectedW = Math.abs(a) * xSize + Math.abs(b) * unitSize;
        if (Math.abs(boundingWidth - expectedW) <= 24) {
          for (const c of cList) {
            for (const d of dList) {
              if (c === 0 && d === 0) continue;
              const expectedH = Math.abs(c) * xSize + Math.abs(d) * unitSize;
              if (Math.abs(boundingHeight - expectedH) <= 24) {
                const prodX2 = a * c;
                const prodX = a * d + b * c;
                const prodUnit = b * d;

                if (
                  prodX2 === productBreakdown.x2 &&
                  prodX === productBreakdown.x &&
                  prodUnit === productBreakdown.unit
                ) {
                  bestTopX = a;
                  bestTopUnit = b;
                  bestLeftX = c;
                  bestLeftUnit = d;
                  foundValidFit = true;
                  break;
                }
              }
            }
            if (foundValidFit) break;
          }
        }
        if (foundValidFit) break;
      }
    }
  }

  // 3c. Geometric Fallback from bounding width/height
  if (!foundValidFit) {
    let minDiffW = Infinity;
    for (let a = 0; a <= 5; a++) {
      for (let b = 0; b <= 15; b++) {
        if (a === 0 && b === 0) continue;
        const diff = Math.abs(boundingWidth - (a * xSize + b * unitSize));
        if (diff < minDiffW) {
          minDiffW = diff;
          bestTopX = a;
          bestTopUnit = b;
        }
      }
    }

    let minDiffH = Infinity;
    for (let c = 0; c <= 5; c++) {
      for (let d = 0; d <= 15; d++) {
        if (c === 0 && d === 0) continue;
        const diff = Math.abs(boundingHeight - (c * xSize + d * unitSize));
        if (diff < minDiffH) {
          minDiffH = diff;
          bestLeftX = c;
          bestLeftUnit = d;
        }
      }
    }
  }

  // Format dimension strings
  const formatDim = (xCount: number, uCount: number): { label: string; latex: string } => {
    const parts: string[] = [];
    if (xCount !== 0) {
      if (xCount === 1) parts.push('x');
      else if (xCount === -1) parts.push('-x');
      else parts.push(`${xCount}x`);
    }

    if (uCount !== 0) {
      if (parts.length === 0) {
        parts.push(`${uCount}`);
      } else {
        const signStr = uCount > 0 ? `+ ${uCount}` : `- ${Math.abs(uCount)}`;
        parts.push(signStr);
      }
    }

    const raw = parts.length > 0 ? parts.join(' ') : '0';
    const latex = parts.length > 1 ? `(${raw})` : parts.length === 1 ? `(${raw})` : '(0)';
    return { label: raw, latex };
  };

  const topDim = formatDim(bestTopX, bestTopUnit);
  const leftDim = formatDim(bestLeftX, bestLeftUnit);

  const factoredLatex = `${leftDim.latex}${topDim.latex}`;
  const fullEquationLatex = `${factoredLatex} = ${productBreakdown.simplifiedLatex}`;

  const expectedProductX2 = bestLeftX * bestTopX;
  const expectedProductX = bestLeftX * bestTopUnit + bestLeftUnit * bestTopX;
  const expectedProductUnit = bestLeftUnit * bestTopUnit;

  const isValidTrinomialFactoring =
    foundValidFit ||
    ((bestTopX !== 0 || bestTopUnit !== 0) &&
      (bestLeftX !== 0 || bestLeftUnit !== 0) &&
      productBreakdown.x2 === expectedProductX2 &&
      productBreakdown.x === expectedProductX &&
      productBreakdown.unit === expectedProductUnit);

  return {
    isSolidRectangle: true,
    tilesInRect: tiles,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: boundingWidth,
      height: boundingHeight,
    },
    topDimension: {
      xCount: bestTopX,
      unitCount: bestTopUnit,
      label: topDim.label,
      latex: topDim.latex,
    },
    leftDimension: {
      xCount: bestLeftX,
      unitCount: bestLeftUnit,
      label: leftDim.label,
      latex: leftDim.latex,
    },
    productBreakdown,
    factoredLatex,
    fullEquationLatex,
    isValidTrinomialFactoring,
  };
};

export const parseTargetTerms = (str: string): { x2: number; x: number; unit: number } | null => {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');
  if (!cleaned) return null;

  // e.g. "(x+2)(x+3)"
  const factoredMatch = cleaned.match(/^\(([x])([+-]\d+)\)\(([x])([+-]\d+)\)$/);
  if (factoredMatch) {
    const p = parseInt(factoredMatch[2], 10);
    const q = parseInt(factoredMatch[4], 10);
    return { x2: 1, x: p + q, unit: p * q };
  }

  // Regex parse terms
  const regex = /([+-]?[^+-]+)/g;
  const matches = cleaned.match(regex) || [];
  let x2 = 0;
  let x = 0;
  let unit = 0;

  for (let raw of matches) {
    raw = raw.trim();
    if (!raw) continue;
    let sign = 1;
    if (raw.startsWith('-')) {
      sign = -1;
      raw = raw.substring(1);
    } else if (raw.startsWith('+')) {
      raw = raw.substring(1);
    }

    if (raw.includes('x^2') || raw.includes('x2')) {
      const coeffStr = raw.replace(/x\^?2/, '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      x2 += sign * count;
    } else if (raw.includes('x')) {
      const coeffStr = raw.replace('x', '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      x += sign * count;
    } else {
      const count = Math.abs(parseInt(raw, 10));
      if (!isNaN(count)) {
        unit += sign * count;
      }
    }
  }

  if (x2 === 0 && x === 0 && unit === 0) return null;
  return { x2, x, unit };
};

export const FACTOR_CORNER_X = 160;
export const FACTOR_CORNER_Y = 160;

export interface FactoringModelResult {
  topFactor: ExpressionBreakdown;
  leftFactor: ExpressionBreakdown;
  productArea: ExpressionBreakdown;
  topLatex: string;
  leftLatex: string;
  productLatex: string;
  fullEquationLatex: string;
  isValidFactorization: boolean;
  topCount: number;
  leftCount: number;
  productCount: number;
  solidRectangle: SolidRectangleResult;
}

/**
 * Dedicated Track & Area Factoring Model Evaluator:
 * Evaluates factoring when tiles are in Top Factor Track, Left Factor Track,
 * and Product Area, as well as automatic solid rectangle detection.
 * Strictly verifies completeness, geometry, factor alignment, and target question matching.
 */
export const computeFactoringModel = (
  tiles: TileData[],
  unitSize: number = BASE_UNIT,
  xSize: number = X_UNIT,
  ySize: number = Y_UNIT,
  targetQuestion?: string | null
): FactoringModelResult => {
  // 1. Partition tiles by dedicated tracks / zones
  const topTrackTiles: TileData[] = [];
  const leftTrackTiles: TileData[] = [];
  const productAreaTiles: TileData[] = [];
  const strayTiles: TileData[] = [];

  tiles.forEach((t) => {
    const dim = getTileDimensions(t.kind, t.rotation, unitSize, xSize, ySize);
    const centerX = t.x + dim.width / 2;
    const centerY = t.y + dim.height / 2;

    if (t.zone === 'top_factor') {
      topTrackTiles.push(t);
    } else if (t.zone === 'left_factor') {
      leftTrackTiles.push(t);
    } else if (t.zone === 'product_area') {
      productAreaTiles.push(t);
    } else {
      // Spatial detection with clear boundary at 160px
      if (t.y + dim.height <= 170 || (centerY < 165 && centerX >= 140)) {
        topTrackTiles.push(t);
      } else if (t.x + dim.width <= 170 || (centerX < 165 && centerY >= 140)) {
        leftTrackTiles.push(t);
      } else if (t.x >= 140 && t.y >= 140) {
        productAreaTiles.push(t);
      } else {
        if (centerY < 165) {
          topTrackTiles.push(t);
        } else if (centerX < 165) {
          leftTrackTiles.push(t);
        } else {
          productAreaTiles.push(t);
        }
      }
    }
  });

  // Calculate Top Factor algebraic terms (Width dimension)
  let topX = 0;
  let topUnit = 0;
  topTrackTiles.forEach((t) => {
    if (t.kind === 'x' || t.kind === 'x2') {
      topX += t.sign;
    } else if (t.kind === 'unit') {
      topUnit += t.sign;
    }
  });

  // Calculate Left Factor algebraic terms (Height dimension)
  let leftX = 0;
  let leftUnit = 0;
  leftTrackTiles.forEach((t) => {
    if (t.kind === 'x' || t.kind === 'x2') {
      leftX += t.sign;
    } else if (t.kind === 'unit') {
      leftUnit += t.sign;
    }
  });

  // Evaluate solid rectangle on product area tiles (or all tiles if no tracks)
  const tilesForProduct = productAreaTiles.length > 0 ? productAreaTiles : tiles;
  const solidRect = detectSolidRectangle(tilesForProduct, unitSize, xSize, ySize);
  const productBreakdown = computeExpressionBreakdown(tilesForProduct);

  const formatDimensionString = (xCount: number, uCount: number): { label: string; latex: string } => {
    const parts: string[] = [];
    if (xCount !== 0) {
      if (xCount === 1) parts.push('x');
      else if (xCount === -1) parts.push('-x');
      else parts.push(`${xCount}x`);
    }
    if (uCount !== 0) {
      if (parts.length === 0) {
        parts.push(`${uCount}`);
      } else {
        const signStr = uCount > 0 ? `+ ${uCount}` : `- ${Math.abs(uCount)}`;
        parts.push(signStr);
      }
    }
    const raw = parts.length > 0 ? parts.join(' ') : '0';
    const latex = parts.length > 0 ? `(${raw})` : '(0)';
    return { label: raw, latex };
  };

  const hasTopTrack = topTrackTiles.length > 0;
  const hasLeftTrack = leftTrackTiles.length > 0;
  const hasProductTiles = productAreaTiles.length > 0;

  // Target question polynomial verification if target is present
  const target = targetQuestion ? parseTargetTerms(targetQuestion) : null;
  const matchesTarget = !target || (
    productBreakdown.x2 === target.x2 &&
    productBreakdown.x === target.x &&
    productBreakdown.unit === target.unit
  );

  const topDim = hasTopTrack ? formatDimensionString(topX, topUnit) : solidRect.topDimension;
  const leftDim = hasLeftTrack ? formatDimensionString(leftX, leftUnit) : solidRect.leftDimension;

  const expectedX2 = topX * leftX;
  const expectedX = topX * leftUnit + topUnit * leftX;
  const expectedUnit = topUnit * leftUnit;

  // 1. Algebraic multiplication matches product breakdown
  const isAlgebraicallyValid =
    (topX !== 0 || topUnit !== 0) &&
    (leftX !== 0 || leftUnit !== 0) &&
    productBreakdown.x2 === expectedX2 &&
    productBreakdown.x === expectedX &&
    productBreakdown.unit === expectedUnit;

  // 2. Geometric check: Product area tiles form a solid rectangle
  const isGeometricValid = solidRect.isSolidRectangle && solidRect.isValidTrinomialFactoring;

  // 3. Dimension match: Top track matches width; Left track matches height
  const topTrackMatchesWidth =
    (solidRect.topDimension.xCount === topX && solidRect.topDimension.unitCount === topUnit) ||
    Math.abs(topX * xSize + topUnit * unitSize - solidRect.bounds.width) <= 12 ||
    isAlgebraicallyValid;

  const leftTrackMatchesHeight =
    (solidRect.leftDimension.xCount === leftX && solidRect.leftDimension.unitCount === leftUnit) ||
    Math.abs(leftX * xSize + leftUnit * unitSize - solidRect.bounds.height) <= 12 ||
    isAlgebraicallyValid;

  // Complete Factorization: only valid when both factor tracks are present and match the product rectangle
  const isFullyValid =
    hasTopTrack &&
    hasLeftTrack &&
    (hasProductTiles || solidRect.tilesInRect.length > 0) &&
    strayTiles.length === 0 &&
    isGeometricValid &&
    topTrackMatchesWidth &&
    leftTrackMatchesHeight &&
    isAlgebraicallyValid &&
    matchesTarget;

  const topBreakdown: ExpressionBreakdown = {
    x2: 0,
    y2: 0,
    xy: 0,
    x: topX,
    y: 0,
    unit: topUnit,
    rawCount: {
      positive: Math.max(0, topX) + Math.max(0, topUnit),
      negative: Math.min(0, topX) + Math.min(0, topUnit),
    },
    latex: topDim.latex,
    simplifiedLatex: topDim.label,
    expandedPolynomial: topDim.label,
  };

  const leftBreakdown: ExpressionBreakdown = {
    x2: 0,
    y2: 0,
    xy: 0,
    x: leftX,
    y: 0,
    unit: leftUnit,
    rawCount: {
      positive: Math.max(0, leftX) + Math.max(0, leftUnit),
      negative: Math.min(0, leftX) + Math.min(0, leftUnit),
    },
    latex: leftDim.latex,
    simplifiedLatex: leftDim.label,
    expandedPolynomial: leftDim.label,
  };

  const fullEquationLatex = hasTopTrack && hasLeftTrack
    ? `${leftDim.latex}${topDim.latex} = ${productBreakdown.simplifiedLatex}`
    : solidRect.fullEquationLatex;

  return {
    topFactor: topBreakdown,
    leftFactor: leftBreakdown,
    productArea: productBreakdown,
    topLatex: topDim.latex,
    leftLatex: leftDim.latex,
    productLatex: productBreakdown.simplifiedLatex,
    fullEquationLatex,
    isValidFactorization: isFullyValid,
    topCount: topTrackTiles.length,
    leftCount: leftTrackTiles.length,
    productCount: productAreaTiles.length > 0 ? productAreaTiles.length : tiles.length,
    solidRectangle: solidRect,
  };
};

