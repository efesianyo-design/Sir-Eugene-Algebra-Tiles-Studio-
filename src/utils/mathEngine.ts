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

  // 1. Area Test: Total sum of tile areas must closely equal bounding box area (allow subpixel tolerance)
  const areaTolerance = Math.max(160, tiles.length * (unitSize * 2));
  const areaDifference = Math.abs(totalTileArea - boundingArea);
  const isAreaFilled = areaDifference <= areaTolerance;

  if (!isAreaFilled) {
    return {
      ...emptyResult,
      bounds: { minX, maxX, minY, maxY, width: boundingWidth, height: boundingHeight },
    };
  }

  // 2. Overlap Test: Ensure tiles are not stacked on top of each other (ignore 1-2px edge touching/snapping)
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
      if (interW > 6 && interH > 6 && interArea > 60) {
        return {
          ...emptyResult,
          bounds: { minX, maxX, minY, maxY, width: boundingWidth, height: boundingHeight },
        };
      }
    }
  }

  // 3. Scan Top Edge Tiles (width dimension: a*x + b)
  const topRowTiles = tileRects
    .filter((r) => Math.abs(r.y1 - minY) <= 4)
    .sort((a, b) => a.x1 - b.x1);

  let topXCount = 0;
  let topUnitCount = 0;
  let topCoveredWidth = 0;

  topRowTiles.forEach((r) => {
    const t = r.tile;
    if (t.kind === 'x2') {
      topXCount += t.sign;
      topCoveredWidth += r.w;
    } else if (t.kind === 'x' && t.rotation === 0) {
      // Horizontal x-bar
      topXCount += t.sign;
      topCoveredWidth += r.w;
    } else if (t.kind === 'x' && t.rotation === 90) {
      // Vertical x-bar: width is unitSize
      topUnitCount += t.sign;
      topCoveredWidth += r.w;
    } else if (t.kind === 'unit') {
      topUnitCount += t.sign;
      topCoveredWidth += r.w;
    }
  });

  // Top edge must cover the full bounding width
  const isTopEdgeComplete = Math.abs(topCoveredWidth - boundingWidth) <= 4;

  // 4. Scan Left Edge Tiles (height dimension: c*x + d)
  const leftColTiles = tileRects
    .filter((r) => Math.abs(r.x1 - minX) <= 4)
    .sort((a, b) => a.y1 - b.y1);

  let leftXCount = 0;
  let leftUnitCount = 0;
  let leftCoveredHeight = 0;

  leftColTiles.forEach((r) => {
    const t = r.tile;
    if (t.kind === 'x2') {
      leftXCount += t.sign;
      leftCoveredHeight += r.h;
    } else if (t.kind === 'x' && t.rotation === 90) {
      // Vertical x-bar: height is xSize
      leftXCount += t.sign;
      leftCoveredHeight += r.h;
    } else if (t.kind === 'x' && t.rotation === 0) {
      // Horizontal x-bar: height is unitSize
      leftUnitCount += t.sign;
      leftCoveredHeight += r.h;
    } else if (t.kind === 'unit') {
      leftUnitCount += t.sign;
      leftCoveredHeight += r.h;
    }
  });

  // Left edge must cover the full bounding height
  const isLeftEdgeComplete = Math.abs(leftCoveredHeight - boundingHeight) <= 4;

  const expectedWidthPx = Math.abs(topXCount) * xSize + Math.abs(topUnitCount) * unitSize;
  const expectedHeightPx = Math.abs(leftXCount) * xSize + Math.abs(leftUnitCount) * unitSize;

  const isWidthExact = isTopEdgeComplete && Math.abs(boundingWidth - expectedWidthPx) <= 4;
  const isHeightExact = isLeftEdgeComplete && Math.abs(boundingHeight - expectedHeightPx) <= 4;

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

  const topDim = formatDim(topXCount, topUnitCount);
  const leftDim = formatDim(leftXCount, leftUnitCount);

  const productBreakdown = computeExpressionBreakdown(tiles);
  const factoredLatex = `${leftDim.latex}${topDim.latex}`;
  const fullEquationLatex = `${factoredLatex} = ${productBreakdown.simplifiedLatex}`;

  // Valid Trinomial Factoring condition:
  // (leftX*x + leftUnit) * (topX*x + topUnit) equals product polynomial breakdown exactly!
  const expectedProductX2 = leftXCount * topXCount;
  const expectedProductX = leftXCount * topUnitCount + leftUnitCount * topXCount;
  const expectedProductUnit = leftUnitCount * topUnitCount;

  const isValidTrinomialFactoring =
    isWidthExact &&
    isHeightExact &&
    (topXCount !== 0 || topUnitCount !== 0) &&
    (leftXCount !== 0 || leftUnitCount !== 0) &&
    productBreakdown.x2 === expectedProductX2 &&
    productBreakdown.x === expectedProductX &&
    productBreakdown.unit === expectedProductUnit;

  return {
    isSolidRectangle: isWidthExact && isHeightExact,
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
      xCount: topXCount,
      unitCount: topUnitCount,
      label: topDim.label,
      latex: topDim.latex,
    },
    leftDimension: {
      xCount: leftXCount,
      unitCount: leftUnitCount,
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

export const FACTOR_CORNER_X = 180;
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
    // Explicit zone assignment or coordinate quadrant
    if (t.zone === 'top_factor' || (t.y < FACTOR_CORNER_Y + 15 && t.x >= FACTOR_CORNER_X - 25)) {
      topTrackTiles.push(t);
    } else if (t.zone === 'left_factor' || (t.x < FACTOR_CORNER_X + 15 && t.y >= FACTOR_CORNER_Y - 25)) {
      leftTrackTiles.push(t);
    } else if (t.zone === 'product_area' || (t.x >= FACTOR_CORNER_X - 25 && t.y >= FACTOR_CORNER_Y - 25)) {
      productAreaTiles.push(t);
    } else {
      // Top-Left corner space: if tile is placed horizontally, treat as top track; if vertical, treat as left track
      if (t.kind === 'x' && t.rotation === 0) {
        topTrackTiles.push(t);
      } else if (t.kind === 'x' && t.rotation === 90) {
        leftTrackTiles.push(t);
      } else {
        strayTiles.push(t);
      }
    }
  });

  // Calculate Top Factor algebraic terms (Width dimension)
  let topX = 0;
  let topUnit = 0;
  topTrackTiles.forEach((t) => {
    if (t.kind === 'x' && t.rotation === 0) {
      topX += t.sign;
    } else if (t.kind === 'x2') {
      topX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 90) {
      topUnit += t.sign;
    } else if (t.kind === 'unit') {
      topUnit += t.sign;
    }
  });

  // Calculate Left Factor algebraic terms (Height dimension)
  let leftX = 0;
  let leftUnit = 0;
  leftTrackTiles.forEach((t) => {
    if (t.kind === 'x' && t.rotation === 90) {
      leftX += t.sign;
    } else if (t.kind === 'x2') {
      leftX += t.sign;
    } else if (t.kind === 'x' && t.rotation === 0) {
      leftUnit += t.sign;
    } else if (t.kind === 'unit') {
      leftUnit += t.sign;
    }
  });

  const productBreakdown = computeExpressionBreakdown(productAreaTiles.length > 0 ? productAreaTiles : tiles);
  const solidRect = detectSolidRectangle(productAreaTiles.length > 0 ? productAreaTiles : tiles, unitSize, xSize, ySize);

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
  const hasTrackTiles = hasTopTrack && hasLeftTrack && hasProductTiles && strayTiles.length === 0;

  // Target question polynomial verification if target is present
  const target = targetQuestion ? parseTargetTerms(targetQuestion) : null;
  const matchesTarget = !target || (
    productBreakdown.x2 === target.x2 &&
    productBreakdown.x === target.x &&
    productBreakdown.unit === target.unit
  );

  // Scenario 1: Student is using the Full Factor Track + Product Area Model
  if (hasTrackTiles) {
    const topDim = formatDimensionString(topX, topUnit);
    const leftDim = formatDimensionString(leftX, leftUnit);

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
    const isGeometricValid = solidRect.isSolidRectangle;

    // 3. Dimension match: Top track matches width; Left track matches height
    const topTrackMatchesWidth =
      (solidRect.topDimension.xCount === topX && solidRect.topDimension.unitCount === topUnit) ||
      Math.abs(topX * xSize + topUnit * unitSize - solidRect.bounds.width) <= 8 ||
      isAlgebraicallyValid;

    const leftTrackMatchesHeight =
      (solidRect.leftDimension.xCount === leftX && solidRect.leftDimension.unitCount === leftUnit) ||
      Math.abs(leftX * xSize + leftUnit * unitSize - solidRect.bounds.height) <= 8 ||
      isAlgebraicallyValid;

    const isFullyValid = isAlgebraicallyValid && (isGeometricValid || (topTrackMatchesWidth && leftTrackMatchesHeight)) && matchesTarget;

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

    const fullEquationLatex = `${topDim.latex}${leftDim.latex} = ${productBreakdown.simplifiedLatex}`;

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
      productCount: productAreaTiles.length,
      solidRectangle: solidRect,
    };
  }

  // Scenario 2: Student has placed tiles into a solid rectangle directly on canvas (without track tiles)
  // ONLY valid if NO track tiles are placed, NO stray tiles, and all tiles on canvas form the solid rectangle matching target
  const noTrackTiles = !hasTopTrack && !hasLeftTrack;
  if (noTrackTiles && solidRect.isSolidRectangle && solidRect.isValidTrinomialFactoring && solidRect.tilesInRect.length === tiles.length && tiles.length >= 2 && matchesTarget) {
    const topBreakdown: ExpressionBreakdown = {
      x2: 0,
      y2: 0,
      xy: 0,
      x: solidRect.topDimension.xCount,
      y: 0,
      unit: solidRect.topDimension.unitCount,
      rawCount: {
        positive: Math.max(0, solidRect.topDimension.xCount) + Math.max(0, solidRect.topDimension.unitCount),
        negative: Math.min(0, solidRect.topDimension.xCount) + Math.min(0, solidRect.topDimension.unitCount),
      },
      latex: solidRect.topDimension.latex,
      simplifiedLatex: solidRect.topDimension.label,
      expandedPolynomial: solidRect.topDimension.label,
    };

    const leftBreakdown: ExpressionBreakdown = {
      x2: 0,
      y2: 0,
      xy: 0,
      x: solidRect.leftDimension.xCount,
      y: 0,
      unit: solidRect.leftDimension.unitCount,
      rawCount: {
        positive: Math.max(0, solidRect.leftDimension.xCount) + Math.max(0, solidRect.leftDimension.unitCount),
        negative: Math.min(0, solidRect.leftDimension.xCount) + Math.min(0, solidRect.leftDimension.unitCount),
      },
      latex: solidRect.leftDimension.latex,
      simplifiedLatex: solidRect.leftDimension.label,
      expandedPolynomial: solidRect.leftDimension.label,
    };

    return {
      topFactor: topBreakdown,
      leftFactor: leftBreakdown,
      productArea: solidRect.productBreakdown,
      topLatex: solidRect.topDimension.latex,
      leftLatex: solidRect.leftDimension.latex,
      productLatex: solidRect.productBreakdown.simplifiedLatex,
      fullEquationLatex: solidRect.fullEquationLatex,
      isValidFactorization: true,
      topCount: solidRect.topDimension.xCount + solidRect.topDimension.unitCount,
      leftCount: solidRect.leftDimension.xCount + solidRect.leftDimension.unitCount,
      productCount: tiles.length,
      solidRectangle: solidRect,
    };
  }

  // Scenario 3: Incomplete or in-progress factoring
  const totalBreakdown = computeExpressionBreakdown(tiles);
  const topDim = topTrackTiles.length > 0 ? formatDimensionString(topX, topUnit) : { label: '?', latex: '(?)' };
  const leftDim = leftTrackTiles.length > 0 ? formatDimensionString(leftX, leftUnit) : { label: '?', latex: '(?)' };

  return {
    topFactor: computeExpressionBreakdown(topTrackTiles),
    leftFactor: computeExpressionBreakdown(leftTrackTiles),
    productArea: totalBreakdown,
    topLatex: topDim.latex,
    leftLatex: leftDim.latex,
    productLatex: totalBreakdown.simplifiedLatex,
    fullEquationLatex: `${topDim.latex} ${leftDim.latex} = ${totalBreakdown.simplifiedLatex}`,
    isValidFactorization: false,
    topCount: topTrackTiles.length,
    leftCount: leftTrackTiles.length,
    productCount: productAreaTiles.length > 0 ? productAreaTiles.length : tiles.length,
    solidRectangle: solidRect,
  };
};

