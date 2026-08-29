import { TileKind, Challenge } from '../types';

export const BASE_UNIT = 28; // base 1 unit size u = 28px
export const X_UNIT = 140;   // base x length = 140px (exact 5 * 28px for x, 140 x 140px for x²)
export const Y_UNIT = 140;   // base y length = 140px

export interface TileDimensions {
  width: number;
  height: number;
}

export const getTileDimensions = (
  kind: TileKind,
  rotation: 0 | 90 = 0,
  unitSize: number = BASE_UNIT,
  xSize: number = X_UNIT,
  ySize: number = Y_UNIT
): TileDimensions => {
  switch (kind) {
    case 'unit':
      // Unit Tile (1 / -1): 28 x 28px
      return { width: unitSize, height: unitSize };
    case 'x':
      // Variable Tile (x / -x): 148 x 28px (horizontal at 0°, vertical 28 x 148px at 90°)
      return rotation === 0
        ? { width: xSize, height: unitSize }
        : { width: unitSize, height: xSize };
    case 'y':
      return rotation === 0
        ? { width: ySize, height: unitSize }
        : { width: unitSize, height: ySize };
    case 'x2':
      // Quadratic Tile (x² / -x²): 148 x 148px
      return { width: xSize, height: xSize };
    case 'y2':
      return { width: ySize, height: ySize };
    case 'xy':
      return rotation === 0
        ? { width: xSize, height: ySize }
        : { width: ySize, height: xSize };
  }
};

export const TILE_COLOR_CONFIG: Record<
  TileKind,
  {
    name: string;
    posLabel: string;
    negLabel: string;
    posBg: string;
    posBorder: string;
    posText: string;
    posGlow: string;
    negBg: string;
    negBorder: string;
    negText: string;
    negGlow: string;
  }
> = {
  unit: {
    name: 'Unit (1)',
    posLabel: '+1',
    negLabel: '-1',
    posBg: '#eab308', // Yellow for +1 (28x28px)
    posBorder: '#ca8a04',
    posText: '#713f12',
    posGlow: 'rgba(234, 179, 8, 0.4)',
    negBg: '#ef4444', // Red for -1 (28x28px)
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
  x: {
    name: 'x bar',
    posLabel: '+x',
    negLabel: '-x',
    posBg: '#10b981', // Green for +x (148x28px)
    posBorder: '#059669',
    posText: '#ffffff',
    posGlow: 'rgba(16, 185, 129, 0.4)',
    negBg: '#ef4444', // Red for -x (148x28px)
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
  y: {
    name: 'y bar',
    posLabel: '+y',
    negLabel: '-y',
    posBg: '#10b981', // Green
    posBorder: '#059669',
    posText: '#ffffff',
    posGlow: 'rgba(16, 185, 129, 0.4)',
    negBg: '#ef4444', // Red
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
  x2: {
    name: 'x² square',
    posLabel: '+x²',
    negLabel: '-x²',
    posBg: '#3b82f6', // Blue for +x² (148x148px)
    posBorder: '#2563eb',
    posText: '#ffffff',
    posGlow: 'rgba(59, 130, 246, 0.4)',
    negBg: '#ef4444', // Red for -x² (148x148px)
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
  y2: {
    name: 'y² square',
    posLabel: '+y²',
    negLabel: '-y²',
    posBg: '#3b82f6', // Blue
    posBorder: '#2563eb',
    posText: '#ffffff',
    posGlow: 'rgba(59, 130, 246, 0.4)',
    negBg: '#ef4444', // Red
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
  xy: {
    name: 'xy rectangle',
    posLabel: '+xy',
    negLabel: '-xy',
    posBg: '#8b5cf6', // Violet / Purple
    posBorder: '#7c3aed',
    posText: '#ffffff',
    posGlow: 'rgba(139, 92, 246, 0.4)',
    negBg: '#ef4444', // Red
    negBorder: '#dc2626',
    negText: '#ffffff',
    negGlow: 'rgba(239, 68, 68, 0.4)',
  },
};

export const BUILT_IN_CHALLENGES: Challenge[] = [
  // Category 1: Simplify Expressions & Zero Pairs
  {
    id: 'ch-simp-1',
    category: 'simplify',
    title: 'Model & Cancel: 2x - x + 3',
    description: 'Place 2 positive x tiles, 1 negative x tile, and 3 unit tiles. Group the zero pair (+x and -x) to cancel them out!',
    targetLatex: 'x + 3',
    hint: 'Drag the negative -x tile close to one of the +x tiles or tap the "Cancel Zero Pairs" button to simplify!',
    initialTiles: [
      { kind: 'x', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 120, rotation: 0, zone: 'main' },
      { kind: 'x', sign: -1, x: 80, y: 160, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 260, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 300, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 340, y: 80, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let xCount = 0;
      let unitCount = 0;
      let other = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x') xCount += t.sign;
        else if (t.kind === 'unit') unitCount += t.sign;
        else other++;
      });
      return other === 0 && xCount === 1 && unitCount === 3;
    },
  },
  {
    id: 'ch-simp-2',
    category: 'simplify',
    title: 'Simplify: 2x² - x² + 3x - 4',
    description: 'Eliminate zero pairs from 2x² - x² + 3x - 4 to reach the simplified polynomial in standard form.',
    targetLatex: 'x^2 + 3x - 4',
    hint: 'Combine the +x² and -x² into a zero pair so only 1 x² square remains.',
    initialTiles: [
      { kind: 'x2', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x2', sign: 1, x: 240, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x2', sign: -1, x: 400, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 250, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 290, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 330, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: -1, x: 260, y: 250, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: -1, x: 300, y: 250, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: -1, x: 340, y: 250, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: -1, x: 380, y: 250, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0, other = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        else if (t.kind === 'x') x += t.sign;
        else if (t.kind === 'unit') u += t.sign;
        else other++;
      });
      return other === 0 && x2 === 1 && x === 3 && u === -4;
    },
  },
  {
    id: 'ch-simp-3',
    category: 'simplify',
    title: 'Multi-Variable: 2x + 3y - x - 2y + 1',
    description: 'Place positive and negative x and y tiles and simplify the expression to standard form.',
    targetLatex: 'x + y + 1',
    hint: 'Pair up the +x with -x and +y with -y to eliminate the redundant zero pairs.',
    initialTiles: [
      { kind: 'x', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 120, rotation: 0, zone: 'main' },
      { kind: 'x', sign: -1, x: 80, y: 160, rotation: 0, zone: 'main' },
      { kind: 'y', sign: 1, x: 250, y: 80, rotation: 0, zone: 'main' },
      { kind: 'y', sign: 1, x: 250, y: 120, rotation: 0, zone: 'main' },
      { kind: 'y', sign: 1, x: 250, y: 160, rotation: 0, zone: 'main' },
      { kind: 'y', sign: -1, x: 250, y: 200, rotation: 0, zone: 'main' },
      { kind: 'y', sign: -1, x: 250, y: 240, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 420, y: 80, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let x = 0, y = 0, u = 0, other = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x') x += t.sign;
        else if (t.kind === 'y') y += t.sign;
        else if (t.kind === 'unit') u += t.sign;
        else other++;
      });
      return other === 0 && x === 1 && y === 1 && u === 1;
    },
  },

  // Category 2: Solving Linear Equations (Equation Balance Mat)
  {
    id: 'ch-eq-1',
    category: 'equations',
    title: 'Solve: x + 3 = 7',
    description: 'On the Equation Mat, isolate x on the left by taking 3 units from both sides.',
    targetLatex: 'x = 4',
    targetLeftLatex: 'x + 3',
    targetRightLatex: '7',
    hint: 'Subtract 3 unit tiles from both sides (or add 3 negative units to both sides to form zero pairs).',
    initialTiles: [
      { kind: 'x', sign: 1, x: 60, y: 80, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 60, y: 120, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 100, y: 120, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 140, y: 120, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 380, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 420, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 460, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 500, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 380, y: 120, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 420, y: 120, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 460, y: 120, rotation: 0, zone: 'right' },
    ],
    solutionCheck: (tiles) => {
      let leftX = 0, leftU = 0;
      let rightX = 0, rightU = 0;
      tiles.forEach((t) => {
        if (t.zone === 'left') {
          if (t.kind === 'x') leftX += t.sign;
          if (t.kind === 'unit') leftU += t.sign;
        } else if (t.zone === 'right') {
          if (t.kind === 'x') rightX += t.sign;
          if (t.kind === 'unit') rightU += t.sign;
        }
      });
      return leftX === 1 && leftU === 0 && rightX === 0 && rightU === 4;
    },
  },
  {
    id: 'ch-eq-2',
    category: 'equations',
    title: 'Solve: 2x + 1 = x + 4',
    description: 'Model 2x + 1 on the left and x + 4 on the right. Remove x and 1 from both sides to find x.',
    targetLatex: 'x = 3',
    targetLeftLatex: '2x + 1',
    targetRightLatex: 'x + 4',
    hint: 'Take away 1 x from both sides: you get x + 1 = 4. Then take away 1 unit from both sides: x = 3.',
    initialTiles: [
      { kind: 'x', sign: 1, x: 60, y: 80, rotation: 0, zone: 'left' },
      { kind: 'x', sign: 1, x: 60, y: 120, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 60, y: 160, rotation: 0, zone: 'left' },
      { kind: 'x', sign: 1, x: 380, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 380, y: 120, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 420, y: 120, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 460, y: 120, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 500, y: 120, rotation: 0, zone: 'right' },
    ],
    solutionCheck: (tiles) => {
      let leftX = 0, leftU = 0, rightX = 0, rightU = 0;
      tiles.forEach((t) => {
        if (t.zone === 'left') {
          if (t.kind === 'x') leftX += t.sign;
          if (t.kind === 'unit') leftU += t.sign;
        } else if (t.zone === 'right') {
          if (t.kind === 'x') rightX += t.sign;
          if (t.kind === 'unit') rightU += t.sign;
        }
      });
      return leftX === 1 && leftU === 0 && rightX === 0 && rightU === 3;
    },
  },
  {
    id: 'ch-eq-3',
    category: 'equations',
    title: 'Solve with Negatives: 2x - 3 = 5',
    description: 'Model 2x - 3 on the left side and 5 on the right side. Add 3 positive units to both sides to cancel -3, then divide.',
    targetLatex: 'x = 4',
    targetLeftLatex: '2x - 3',
    targetRightLatex: '5',
    hint: 'Add 3 positive units to both sides. Left becomes 2x, right becomes 8. Then 1 x corresponds to 4 units.',
    initialTiles: [
      { kind: 'x', sign: 1, x: 60, y: 80, rotation: 0, zone: 'left' },
      { kind: 'x', sign: 1, x: 60, y: 120, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: -1, x: 60, y: 160, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: -1, x: 100, y: 160, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: -1, x: 140, y: 160, rotation: 0, zone: 'left' },
      { kind: 'unit', sign: 1, x: 380, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 420, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 460, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 500, y: 80, rotation: 0, zone: 'right' },
      { kind: 'unit', sign: 1, x: 540, y: 80, rotation: 0, zone: 'right' },
    ],
    solutionCheck: (tiles) => {
      let leftX = 0, leftU = 0, rightX = 0, rightU = 0;
      tiles.forEach((t) => {
        if (t.zone === 'left') {
          if (t.kind === 'x') leftX += t.sign;
          if (t.kind === 'unit') leftU += t.sign;
        } else if (t.zone === 'right') {
          if (t.kind === 'x') rightX += t.sign;
          if (t.kind === 'unit') rightU += t.sign;
        }
      });
      return (leftX === 1 && leftU === 0 && rightX === 0 && rightU === 4) || (leftX === 2 && leftU === 0 && rightX === 0 && rightU === 8);
    },
  },

  // Category 3: Area Model Binomial Multiplication
  {
    id: 'ch-mult-1',
    category: 'multiplication',
    title: 'Multiply: (x + 2)(x + 3)',
    description: 'Use the Factor Track Area Model: place (x + 2) along the top and (x + 3) along the left, then fill the interior rectangle!',
    targetLatex: 'x^2 + 5x + 6',
    hint: 'Top has 1 x and 2 units. Left has 1 x and 3 units. Fill the area with 1 x² square, 5 x bars, and 6 units.',
    initialTiles: [
      { kind: 'x', sign: 1, x: 80, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 240, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 280, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'x', sign: 1, x: 20, y: 80, rotation: 90, zone: 'left_factor' },
      { kind: 'unit', sign: 1, x: 20, y: 240, rotation: 0, zone: 'left_factor' },
      { kind: 'unit', sign: 1, x: 20, y: 280, rotation: 0, zone: 'left_factor' },
      { kind: 'unit', sign: 1, x: 20, y: 320, rotation: 0, zone: 'left_factor' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        if (t.kind === 'x') x += t.sign;
        if (t.kind === 'unit') u += t.sign;
      });
      return x2 === 1 && x === 5 && u === 6;
    },
  },
  {
    id: 'ch-mult-2',
    category: 'multiplication',
    title: 'Multiply: (x + 4)(x + 1)',
    description: 'Build the area model for (x + 4)(x + 1) and calculate the expanded polynomial expression.',
    targetLatex: 'x^2 + 5x + 4',
    hint: '1 x² square, 4 horizontal/vertical x bars + 1 x bar = 5 x bars, and 4 unit squares.',
    initialTiles: [
      { kind: 'x', sign: 1, x: 80, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 240, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 280, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 320, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'unit', sign: 1, x: 360, y: 20, rotation: 0, zone: 'top_factor' },
      { kind: 'x', sign: 1, x: 20, y: 80, rotation: 90, zone: 'left_factor' },
      { kind: 'unit', sign: 1, x: 20, y: 240, rotation: 0, zone: 'left_factor' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        if (t.kind === 'x') x += t.sign;
        if (t.kind === 'unit') u += t.sign;
      });
      return x2 === 1 && x === 5 && u === 4;
    },
  },

  // Category 4: Factoring Quadratic Trinomials
  {
    id: 'ch-fact-1',
    category: 'factoring',
    title: 'Factor Trinomial: x² + 4x + 3',
    description: 'Arrange 1 x² square, 4 x bars, and 3 units into a seamless solid rectangle to find the binomial factors.',
    targetLatex: '(x + 1)(x + 3)',
    hint: 'Place 1 x² in the upper left, 3 x bars horizontally or vertically, 1 x bar in the other dimension, and 3 units in the corner!',
    initialTiles: [
      { kind: 'x2', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 120, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 160, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 200, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 420, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 460, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 500, y: 80, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        if (t.kind === 'x') x += t.sign;
        if (t.kind === 'unit') u += t.sign;
      });
      return x2 === 1 && x === 4 && u === 3;
    },
  },
  {
    id: 'ch-fact-2',
    category: 'factoring',
    title: 'Factor Trinomial: x² + 5x + 6',
    description: 'Find the dimensions of the rectangle formed by 1 x² tile, 5 x tiles, and 6 unit tiles.',
    targetLatex: '(x + 2)(x + 3)',
    hint: 'Split 5x into 2x and 3x. Place 2 x bars on one side and 3 x bars on the other, completed by a 2x3 grid of units.',
    initialTiles: [
      { kind: 'x2', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 120, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 160, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 200, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 240, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 420, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 460, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 500, y: 80, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 420, y: 120, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 460, y: 120, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 500, y: 120, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        if (t.kind === 'x') x += t.sign;
        if (t.kind === 'unit') u += t.sign;
      });
      return x2 === 1 && x === 5 && u === 6;
    },
  },
  {
    id: 'ch-fact-3',
    category: 'factoring',
    title: 'Factor: 2x² + 5x + 2',
    description: 'Arrange 2 x² squares, 5 x bars, and 2 unit tiles into a solid single rectangle.',
    targetLatex: '(2x + 1)(x + 2)',
    hint: 'Place 2 x² squares side-by-side or stacked. The dimensions will be (2x + 1) by (x + 2).',
    initialTiles: [
      { kind: 'x2', sign: 1, x: 80, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x2', sign: 1, x: 240, y: 80, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 250, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 290, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 80, y: 330, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 250, rotation: 0, zone: 'main' },
      { kind: 'x', sign: 1, x: 250, y: 290, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 420, y: 250, rotation: 0, zone: 'main' },
      { kind: 'unit', sign: 1, x: 460, y: 250, rotation: 0, zone: 'main' },
    ],
    solutionCheck: (tiles) => {
      let x2 = 0, x = 0, u = 0;
      tiles.forEach((t) => {
        if (t.kind === 'x2') x2 += t.sign;
        if (t.kind === 'x') x += t.sign;
        if (t.kind === 'unit') u += t.sign;
      });
      return x2 === 2 && x === 5 && u === 2;
    },
  },
];
