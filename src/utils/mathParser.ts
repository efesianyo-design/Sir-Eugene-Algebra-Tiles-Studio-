import { TileData, TileKind, TileSign } from '../types';
import { getTileDimensions } from './constants';

export interface ParsedTerm {
  kind: TileKind;
  sign: TileSign;
  count: number;
}

export interface ParsedSide {
  terms: ParsedTerm[];
  rawString: string;
  totalTiles: number;
}

export interface ParsedEquation {
  left: ParsedSide;
  right: ParsedSide;
  isValid: boolean;
  rawString: string;
}

export interface FactoringAnalysis {
  a: number;
  b: number;
  c: number;
  factor1: { x: number; unit: number } | null;
  factor2: { x: number; unit: number } | null;
  factoredLatex: string | null;
  isValidTrinomial: boolean;
}

/**
 * Clean and normalize mathematical strings (e.g. 2x^2 + 5x + 6 or (x+2)(x+3))
 */
export const normalizeMathString = (str: string): string => {
  let cleaned = str
    .trim()
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/\s+/g, '');

  // Handle (x+a)(x+b) input expansion if user typed factored form
  const factoredMatch = cleaned.match(/^\(([xX])([+-]\d+)\)\(([xX])([+-]\d+)\)$/);
  if (factoredMatch) {
    const p = parseInt(factoredMatch[2], 10);
    const q = parseInt(factoredMatch[4], 10);
    const bCoeff = p + q;
    const cCoeff = p * q;
    const bSign = bCoeff >= 0 ? `+${bCoeff}` : `${bCoeff}`;
    const cSign = cCoeff >= 0 ? `+${cCoeff}` : `${cCoeff}`;
    return `x^2${bSign}x${cSign}`;
  }

  return cleaned;
};

/**
 * Parse an algebraic polynomial string into tokens of terms
 */
export const parsePolynomialString = (str: string): ParsedSide => {
  const normalized = normalizeMathString(str);
  if (!normalized) {
    return { terms: [], rawString: '', totalTiles: 0 };
  }

  // Tokenize terms by splitting at '+' or '-' while keeping the signs
  // e.g. "2x^2-5x+6" -> ["+2x^2", "-5x", "+6"]
  const regex = /([+-]?[^+-]+)/g;
  const matches = normalized.match(regex) || [];

  const terms: ParsedTerm[] = [];
  let totalTiles = 0;

  for (let rawTerm of matches) {
    rawTerm = rawTerm.trim();
    if (!rawTerm) continue;

    let sign: TileSign = 1;
    if (rawTerm.startsWith('-')) {
      sign = -1;
      rawTerm = rawTerm.substring(1);
    } else if (rawTerm.startsWith('+')) {
      sign = 1;
      rawTerm = rawTerm.substring(1);
    }

    rawTerm = rawTerm.toLowerCase();

    // Match kinds: x^2, y^2, xy, x, y, unit
    if (rawTerm.includes('x^2') || rawTerm.includes('x2')) {
      const coeffStr = rawTerm.replace(/x\^?2/, '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      terms.push({ kind: 'x2', sign, count });
      totalTiles += count;
    } else if (rawTerm.includes('y^2') || rawTerm.includes('y2')) {
      const coeffStr = rawTerm.replace(/y\^?2/, '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      terms.push({ kind: 'y2', sign, count });
      totalTiles += count;
    } else if (rawTerm.includes('xy')) {
      const coeffStr = rawTerm.replace('xy', '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      terms.push({ kind: 'xy', sign, count });
      totalTiles += count;
    } else if (rawTerm.includes('x')) {
      const coeffStr = rawTerm.replace('x', '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      terms.push({ kind: 'x', sign, count });
      totalTiles += count;
    } else if (rawTerm.includes('y')) {
      const coeffStr = rawTerm.replace('y', '');
      const count = coeffStr === '' ? 1 : Math.abs(parseInt(coeffStr, 10)) || 1;
      terms.push({ kind: 'y', sign, count });
      totalTiles += count;
    } else {
      // Pure numerical constant
      const count = Math.abs(parseInt(rawTerm, 10));
      if (!isNaN(count) && count > 0) {
        terms.push({ kind: 'unit', sign, count });
        totalTiles += count;
      }
    }
  }

  return {
    terms,
    rawString: str,
    totalTiles,
  };
};

/**
 * Parse an equation string like "2x + 3 = 7" or "3x - 4 = x + 2"
 */
export const parseEquationString = (equationStr: string): ParsedEquation => {
  const parts = equationStr.split('=');
  if (parts.length === 1) {
    // If no equals sign, treat left side as equationStr, right as 0
    return {
      left: parsePolynomialString(parts[0]),
      right: { terms: [], rawString: '0', totalTiles: 0 },
      isValid: true,
      rawString: equationStr,
    };
  }

  const left = parsePolynomialString(parts[0]);
  const right = parsePolynomialString(parts[1]);

  return {
    left,
    right,
    isValid: true,
    rawString: equationStr,
  };
};

/**
 * Generate TileData array from parsed equation for the split balance mat
 */
export const generateTilesFromEquation = (
  eq: ParsedEquation,
  canvasWidth: number = 800,
  startY: number = 100
): TileData[] => {
  const tiles: TileData[] = [];
  const midX = Math.max(380, canvasWidth / 2);
  const GAP = 12;

  // Left Side layout (starts around x: 50, bounded to midX - 40)
  let leftX = 60;
  let leftY = startY;
  let leftRowHeight = 0;
  const leftMaxX = midX - 60;

  eq.left.terms.forEach((term, tIdx) => {
    for (let i = 0; i < term.count; i++) {
      const dim = getTileDimensions(term.kind, 0);
      if (leftX + dim.width > leftMaxX && leftX > 60) {
        leftX = 60;
        leftY += leftRowHeight + GAP;
        leftRowHeight = 0;
      }

      tiles.push({
        id: `tile-eq-left-${tIdx}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kind: term.kind,
        sign: term.sign,
        x: leftX,
        y: leftY,
        rotation: 0,
        zone: 'left',
      });

      leftX += dim.width + GAP;
      leftRowHeight = Math.max(leftRowHeight, dim.height);
    }
  });

  // Right Side layout (starts around midX + 50)
  let rightX = midX + 60;
  let rightY = startY;
  let rightRowHeight = 0;
  const rightMaxX = midX + 360;

  eq.right.terms.forEach((term, tIdx) => {
    for (let i = 0; i < term.count; i++) {
      const dim = getTileDimensions(term.kind, 0);
      if (rightX + dim.width > rightMaxX && rightX > midX + 60) {
        rightX = midX + 60;
        rightY += rightRowHeight + GAP;
        rightRowHeight = 0;
      }

      tiles.push({
        id: `tile-eq-right-${tIdx}-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kind: term.kind,
        sign: term.sign,
        x: rightX,
        y: rightY,
        rotation: 0,
        zone: 'right',
      });

      rightX += dim.width + GAP;
      rightRowHeight = Math.max(rightRowHeight, dim.height);
    }
  });

  return tiles;
};

/**
 * Generate TileData array for Factoring Trinomials
 */
export const generateTilesForFactoring = (
  trinomialStr: string,
  startX: number = 180,
  startY: number = 160
): { tiles: TileData[]; analysis: FactoringAnalysis } => {
  const parsed = parsePolynomialString(trinomialStr);
  const tiles: TileData[] = [];

  let a = 0;
  let b = 0;
  let c = 0;

  parsed.terms.forEach((term) => {
    if (term.kind === 'x2') a += term.sign * term.count;
    if (term.kind === 'x') b += term.sign * term.count;
    if (term.kind === 'unit') c += term.sign * term.count;
  });

  // Find integer factorization for a x^2 + b x + c
  let factor1: { x: number; unit: number } | null = null;
  let factor2: { x: number; unit: number } | null = null;
  let factoredLatex: string | null = null;

  if (a === 1) {
    // For x^2 + b x + c, find p, q such that p*q = c and p+q = b
    for (let p = -50; p <= 50; p++) {
      if (p === 0 && c !== 0) continue;
      const q = b - p;
      if (p * q === c) {
        factor1 = { x: 1, unit: p };
        factor2 = { x: 1, unit: q };
        const pStr = p >= 0 ? `+ ${p}` : `- ${Math.abs(p)}`;
        const qStr = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
        factoredLatex = `(x ${pStr})(x ${qStr})`;
        break;
      }
    }
  } else if (a === 2) {
    // 2x^2 + bx + c -> (2x + p)(x + q)
    for (let p = -50; p <= 50; p++) {
      for (let q = -50; q <= 50; q++) {
        if (p * q === c && 2 * q + p === b) {
          factor1 = { x: 2, unit: p };
          factor2 = { x: 1, unit: q };
          const pStr = p >= 0 ? `+ ${p}` : `- ${Math.abs(p)}`;
          const qStr = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
          factoredLatex = `(2x ${pStr})(x ${qStr})`;
          break;
        }
      }
      if (factor1) break;
    }
  }

  // Populate the workspace with unarranged polynomial tiles for the student to solve
  let curX = startX;
  let curY = startY;

  // 1. Place x^2 tiles
  const x2Terms = parsed.terms.filter((t) => t.kind === 'x2');
  x2Terms.forEach((t) => {
    for (let i = 0; i < t.count; i++) {
      tiles.push({
        id: `fact-x2-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kind: 'x2',
        sign: t.sign,
        x: curX,
        y: curY,
        rotation: 0,
        zone: 'product_area',
      });
      curX += 200;
    }
  });

  // 2. Place x-tiles in a bank
  curX = startX + 210;
  curY = startY;
  const xTerms = parsed.terms.filter((t) => t.kind === 'x');
  xTerms.forEach((t) => {
    for (let i = 0; i < t.count; i++) {
      tiles.push({
        id: `fact-x-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kind: 'x',
        sign: t.sign,
        x: curX + (i % 3) * 200,
        y: curY + Math.floor(i / 3) * 44,
        rotation: 0,
        zone: 'product_area',
      });
    }
  });

  // 3. Place unit tiles in a neat cluster below
  const totalX = xTerms.reduce((sum, t) => sum + t.count, 0);
  const xRows = Math.ceil(totalX / 3);
  curX = startX + 210;
  curY = startY + Math.max(1, xRows) * 44 + 20;
  const unitTerms = parsed.terms.filter((t) => t.kind === 'unit');
  unitTerms.forEach((t) => {
    for (let i = 0; i < t.count; i++) {
      tiles.push({
        id: `fact-u-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kind: 'unit',
        sign: t.sign,
        x: curX + (i % 6) * 44,
        y: curY + Math.floor(i / 6) * 44,
        rotation: 0,
        zone: 'product_area',
      });
    }
  });

  return {
    tiles,
    analysis: {
      a,
      b,
      c,
      factor1,
      factor2,
      factoredLatex,
      isValidTrinomial: a !== 0 || b !== 0 || c !== 0,
    },
  };
};

/**
 * Auto-arrange tiles into the factored geometric area model rectangle with tracks
 */
export const autoArrangeFactoredRectangle = (
  tiles: TileData[],
  factorTopUnit: number,
  factorLeftUnit: number,
  xOrigin: number = 200,
  yOrigin: number = 180
): TileData[] => {
  const xDim = getTileDimensions('x2', 0); // 180x180
  const unitDim = getTileDimensions('unit', 0); // 36x36

  const p = Math.max(0, factorTopUnit);
  const q = Math.max(0, factorLeftUnit);

  const x2Tiles = tiles.filter((t) => t.kind === 'x2');
  const xTiles = tiles.filter((t) => t.kind === 'x');
  const unitTiles = tiles.filter((t) => t.kind === 'unit');

  const arranged: TileData[] = [];

  // 1. Top Factor Track: flush at yOrigin - unitDim.height - 4
  const topTrackY = yOrigin - unitDim.height - 6;
  arranged.push({
    id: `top-track-x-${Date.now()}`,
    kind: 'x',
    sign: 1,
    x: xOrigin,
    y: topTrackY,
    rotation: 0,
    zone: 'top_factor',
  });
  for (let i = 0; i < p; i++) {
    arranged.push({
      id: `top-track-u-${i}-${Date.now()}`,
      kind: 'unit',
      sign: 1,
      x: xOrigin + xDim.width + i * unitDim.width,
      y: topTrackY,
      rotation: 0,
      zone: 'top_factor',
    });
  }

  // 2. Left Factor Track: flush at xOrigin - unitDim.width - 6
  const leftTrackX = xOrigin - unitDim.width - 6;
  arranged.push({
    id: `left-track-x-${Date.now()}`,
    kind: 'x',
    sign: 1,
    x: leftTrackX,
    y: yOrigin,
    rotation: 90,
    zone: 'left_factor',
  });
  for (let j = 0; j < q; j++) {
    arranged.push({
      id: `left-track-u-${j}-${Date.now()}`,
      kind: 'unit',
      sign: 1,
      x: leftTrackX,
      y: yOrigin + xDim.height + j * unitDim.height,
      rotation: 0,
      zone: 'left_factor',
    });
  }

  // 3. Product Area: x² at (xOrigin, yOrigin)
  if (x2Tiles.length > 0) {
    arranged.push({
      ...x2Tiles[0],
      x: xOrigin,
      y: yOrigin,
      rotation: 0,
      zone: 'product_area',
    });
  } else {
    arranged.push({
      id: `prod-x2-${Date.now()}`,
      kind: 'x2',
      sign: 1,
      x: xOrigin,
      y: yOrigin,
      rotation: 0,
      zone: 'product_area',
    });
  }

  // Vertical x-bars (width: 28, height: 140)
  for (let i = 0; i < p; i++) {
    const existing = xTiles[i];
    arranged.push({
      ...(existing || { id: `prod-x-top-${i}-${Date.now()}`, kind: 'x', sign: 1 }),
      x: xOrigin + xDim.width + i * unitDim.width,
      y: yOrigin,
      rotation: 90,
      zone: 'product_area',
    });
  }

  // Horizontal x-bars (width: 140, height: 28)
  for (let j = 0; j < q; j++) {
    const existing = xTiles[p + j];
    arranged.push({
      ...(existing || { id: `prod-x-left-${j}-${Date.now()}`, kind: 'x', sign: 1 }),
      x: xOrigin,
      y: yOrigin + xDim.height + j * unitDim.height,
      rotation: 0,
      zone: 'product_area',
    });
  }

  // Unit tiles (28x28)
  let uIdx = 0;
  for (let r = 0; r < q; r++) {
    for (let c = 0; c < p; c++) {
      const existing = unitTiles[uIdx];
      arranged.push({
        ...(existing || { id: `prod-u-${r}-${c}-${Date.now()}`, kind: 'unit', sign: 1 }),
        x: xOrigin + xDim.width + c * unitDim.width,
        y: yOrigin + xDim.height + r * unitDim.height,
        rotation: 0,
        zone: 'product_area',
      });
      uIdx++;
    }
  }

  return arranged;
};

/**
 * Group right-side constant units into equal horizontal rows matching the x-tiles (Divide step)
 */
export const groupConstantsByXRows = (
  tiles: TileData[],
  canvasMidX: number = 400
): { updatedTiles: TileData[]; unitPerRow: number; isDivisible: boolean } => {
  const leftXTiles = tiles.filter((t) => (t.zone === 'left' || t.x < canvasMidX) && t.kind === 'x');
  const rightUnitTiles = tiles.filter((t) => (t.zone === 'right' || t.x >= canvasMidX) && t.kind === 'unit');

  if (leftXTiles.length === 0 || rightUnitTiles.length === 0) {
    return { updatedTiles: tiles, unitPerRow: 0, isDivisible: false };
  }

  const numX = leftXTiles.length;
  const numUnits = rightUnitTiles.length;
  const isDivisible = numUnits % numX === 0;
  const unitsPerRow = Math.floor(numUnits / numX);

  const startY = 120;
  const ROW_GAP = 54;
  const UNIT_GAP = 36;
  const rightStartX = canvasMidX + 80;

  // Align left x-tiles in clean vertical stack
  const newLeftTiles = leftXTiles.map((tile, idx) => ({
    ...tile,
    x: 100,
    y: startY + idx * ROW_GAP,
    rotation: 0 as const,
    zone: 'left' as const,
  }));

  // Align right unit-tiles into matching horizontal rows alongside each x-tile!
  const newRightTiles = rightUnitTiles.map((tile, idx) => {
    const rowIndex = Math.floor(idx / Math.max(1, unitsPerRow));
    const colIndex = idx % Math.max(1, unitsPerRow);
    return {
      ...tile,
      x: rightStartX + colIndex * UNIT_GAP,
      y: startY + rowIndex * ROW_GAP + 2,
      rotation: 0 as const,
      zone: 'right' as const,
    };
  });

  const updatedIds = new Set([...newLeftTiles, ...newRightTiles].map((t) => t.id));
  const otherTiles = tiles.filter((t) => !updatedIds.has(t.id));

  return {
    updatedTiles: [...newLeftTiles, ...newRightTiles, ...otherTiles],
    unitPerRow: unitsPerRow,
    isDivisible,
  };
};
