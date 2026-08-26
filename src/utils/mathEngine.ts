import { TileData, TileKind, ExpressionBreakdown, ZeroPairCandidate } from '../types';
import { getTileDimensions } from './constants';

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
}

export const computeFactoringModel = (tiles: TileData[]): FactoringModelResult => {
  const topTiles = tiles.filter((t) => t.y < 160 && t.x >= 160);
  const leftTiles = tiles.filter((t) => t.x < 160 && t.y >= 160);
  const productTiles = tiles.filter((t) => t.x >= 160 && t.y >= 160);

  const topBreakdown = computeExpressionBreakdown(topTiles);
  const leftBreakdown = computeExpressionBreakdown(leftTiles);
  const productBreakdown = computeExpressionBreakdown(productTiles);

  const formatFactor = (b: ExpressionBreakdown): string => {
    if (b.simplifiedLatex === '0') return '0';
    // If multiple terms and not single constant/variable, wrap in parentheses
    const hasMultipleTerms = b.simplifiedLatex.includes('+') || b.simplifiedLatex.includes('-');
    if (hasMultipleTerms && !b.simplifiedLatex.startsWith('-')) {
      return `(${b.simplifiedLatex})`;
    } else if (hasMultipleTerms) {
      return `(${b.simplifiedLatex})`;
    }
    return `(${b.simplifiedLatex})`;
  };

  const topLatex = topTiles.length > 0 ? formatFactor(topBreakdown) : '(?)';
  const leftLatex = leftTiles.length > 0 ? formatFactor(leftBreakdown) : '(?)';
  const productLatex = productTiles.length > 0 ? productBreakdown.simplifiedLatex : '0';

  // Multiply (a_x*x + c_1) * (b_x*x + c_2) to test if it equals the product polynomial
  // (top.x*x + top.unit) * (left.x*x + left.unit) = top.x*left.x*x^2 + (top.x*left.unit + top.unit*left.x)*x + top.unit*left.unit
  const expectedX2 = topBreakdown.x * leftBreakdown.x;
  const expectedX = topBreakdown.x * leftBreakdown.unit + topBreakdown.unit * leftBreakdown.x;
  const expectedUnit = topBreakdown.unit * leftBreakdown.unit;

  const isValidFactorization =
    topTiles.length > 0 &&
    leftTiles.length > 0 &&
    productTiles.length > 0 &&
    productBreakdown.x2 === expectedX2 &&
    productBreakdown.x === expectedX &&
    productBreakdown.unit === expectedUnit;

  const fullEquationLatex = `${leftLatex}${topLatex} = ${productLatex}`;

  return {
    topFactor: topBreakdown,
    leftFactor: leftBreakdown,
    productArea: productBreakdown,
    topLatex,
    leftLatex,
    productLatex,
    fullEquationLatex,
    isValidFactorization,
    topCount: topTiles.length,
    leftCount: leftTiles.length,
    productCount: productTiles.length,
  };
};

