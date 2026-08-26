export type TileKind = 'unit' | 'x' | 'y' | 'x2' | 'y2' | 'xy';

export type TileSign = 1 | -1;

export interface TileData {
  id: string;
  kind: TileKind;
  sign: TileSign;
  x: number;
  y: number;
  rotation: 0 | 90; // 0 = standard, 90 = rotated (for x, y, xy bars)
  zone?: 'left' | 'right' | 'top_factor' | 'left_factor' | 'product_area' | 'main';
  isZeroPairWith?: string; // id of paired opposing tile
}

export type WorkspaceMode = 'freeform' | 'equation' | 'factor' | 'challenges';

export interface GridConfig {
  unitSize: number; // base pixel size for 1 unit (e.g. 40)
  xSize: number;    // pixel length for x (e.g. 120, non-integer multiple of unit for realistic math representation)
  ySize: number;    // pixel length for y (e.g. 160)
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface ZeroPairCandidate {
  tile1Id: string;
  tile2Id: string;
  kind: TileKind;
}

export interface Challenge {
  id: string;
  category: 'simplify' | 'equations' | 'multiplication' | 'factoring';
  title: string;
  description: string;
  targetLatex: string;
  targetLeftLatex?: string;
  targetRightLatex?: string;
  initialTiles?: Omit<TileData, 'id'>[];
  targetFactors?: {
    top: string;
    left: string;
  };
  solutionCheck: (tiles: TileData[], extra?: { topFactors?: TileData[]; leftFactors?: TileData[] }) => boolean;
  hint: string;
}

export interface ExpressionBreakdown {
  x2: number;
  y2: number;
  xy: number;
  x: number;
  y: number;
  unit: number;
  rawCount: {
    positive: number;
    negative: number;
  };
  latex: string;
  simplifiedLatex: string;
  expandedPolynomial: string;
}
