import { TileData, WorkspaceMode } from '../types';
import { computeExpressionBreakdown, findZeroPairs, computeFactoringModel } from './mathEngine';
import { FactoringAnalysis } from './mathParser';

export interface SocraticAdvice {
  headline: string;
  hint: string;
  actionSuggestion?: string;
  status:
    | 'setup'
    | 'zero_pairs'
    | 'eliminate_variables'
    | 'eliminate_constants'
    | 'ready_to_divide'
    | 'factoring_in_progress'
    | 'factoring_complete'
    | 'simplifying'
    | 'solved';
  celebration?: boolean;
}

export const getSocraticAdvice = (
  tiles: TileData[],
  mode: WorkspaceMode,
  customTarget?: { rawString: string; factoringAnalysis?: FactoringAnalysis | null } | null,
  canvasWidth: number = 800
): SocraticAdvice => {
  const midX = canvasWidth / 2;
  const zeroPairs = findZeroPairs(tiles);

  // 1. EQUATION BALANCE MAT ADVICE
  if (mode === 'equation') {
    const leftTiles = tiles.filter((t) => t.zone === 'left' || (t.zone !== 'right' && t.x < midX));
    const rightTiles = tiles.filter((t) => t.zone === 'right' || (t.zone !== 'left' && t.x >= midX));

    const leftBreakdown = computeExpressionBreakdown(leftTiles);
    const rightBreakdown = computeExpressionBreakdown(rightTiles);

    if (tiles.length === 0) {
      return {
        headline: 'Equation Workspace Ready',
        hint: 'Type an equation above (like 2x + 3 = 7) and click "Auto-Load Tiles", or drag tiles to build both sides.',
        actionSuggestion: 'Enter equation or spawn tiles',
        status: 'setup',
      };
    }

    // A. Check for zero pairs on left or right
    if (zeroPairs.length > 0) {
      return {
        headline: `${zeroPairs.length} Zero Pair${zeroPairs.length > 1 ? 's' : ''} on the Board`,
        hint: 'Opposing positive and negative tiles cancel each other out to zero. Click "Cancel Zero Pairs" to simplify both sides.',
        actionSuggestion: 'Cancel Zero Pairs',
        status: 'zero_pairs',
      };
    }

    // B. Check if equation is already solved: Left = 1x and Right = constant (or vice-versa)
    if (
      leftBreakdown.x === 1 &&
      leftBreakdown.x2 === 0 &&
      leftBreakdown.unit === 0 &&
      rightBreakdown.x === 0 &&
      rightBreakdown.x2 === 0
    ) {
      return {
        headline: `🎉 Equation Solved: x = ${rightBreakdown.unit}!`,
        hint: `Every 1 x-tile corresponds to ${rightBreakdown.unit} unit tile${rightBreakdown.unit === 1 ? '' : 's'}. You balanced both sides successfully!`,
        status: 'solved',
        celebration: true,
      };
    }

    // C. Check if isolated and ready for division: e.g. 2x = 4, 3x = 9, -2x = 6
    if (
      leftBreakdown.x > 1 &&
      leftBreakdown.unit === 0 &&
      rightBreakdown.x === 0 &&
      rightBreakdown.unit !== 0
    ) {
      const unitsPerX = Math.round(rightBreakdown.unit / leftBreakdown.x);
      return {
        headline: `Ready to Find 1x (${leftBreakdown.x}x = ${rightBreakdown.unit})`,
        hint: `All variables are on the left and units on the right! Divide the ${rightBreakdown.unit} units equally across the ${leftBreakdown.x} x-tiles.`,
        actionSuggestion: 'Click "➗ Divide / Find 1x"',
        status: 'ready_to_divide',
      };
    }

    // D. Variables exist on both sides (e.g. 3x - 4 = x + 2)
    if (leftBreakdown.x !== 0 && rightBreakdown.x !== 0) {
      const rightXSign = rightBreakdown.x > 0 ? '+x' : '-x';
      const oppXSign = rightBreakdown.x > 0 ? '-x' : '+x';
      return {
        headline: 'Variables on Both Sides of "="',
        hint: `Notice ${rightXSign} on the right side. What happens to the balance if you add ${oppXSign} to both sides?`,
        actionSuggestion: `Add ${oppXSign} to both sides`,
        status: 'eliminate_variables',
      };
    }

    // E. Constants exist on the variable side (e.g. 2x + 3 = 7 or x - 4 = 6)
    if (leftBreakdown.x !== 0 && leftBreakdown.unit !== 0) {
      const unitSign = leftBreakdown.unit > 0 ? '+1' : '-1';
      const oppUnitSign = leftBreakdown.unit > 0 ? '-1' : '+1';
      const absUnit = Math.abs(leftBreakdown.unit);
      return {
        headline: `Isolate the Variable (${leftBreakdown.simplifiedLatex} = ${rightBreakdown.simplifiedLatex})`,
        hint: `To get ${leftBreakdown.x}x alone on the left side, what could you add to both sides to cancel out the ${leftBreakdown.unit > 0 ? '+' : ''}${leftBreakdown.unit}?`,
        actionSuggestion: `Add ${oppUnitSign} (${absUnit} times) to both sides`,
        status: 'eliminate_constants',
      };
    }

    return {
      headline: 'Balancing in Progress',
      hint: 'Maintain balance by applying the same operation to both the left and right mats.',
      status: 'eliminate_constants',
    };
  }

  // 2. FACTORING / AREA MODEL ADVICE
  if (mode === 'factor') {
    const factorModel = computeFactoringModel(tiles);

    if (tiles.length === 0) {
      return {
        headline: 'Factoring Grid Ready',
        hint: 'Enter a quadratic trinomial (like x^2 + 5x + 6) above and click "Auto-Load Tiles" to build the area rectangle.',
        actionSuggestion: 'Enter trinomial or place tiles',
        status: 'setup',
      };
    }

    if (factorModel.isValidFactorization) {
      return {
        headline: `🎉 Perfectly Factored: ${factorModel.fullEquationLatex}!`,
        hint: `The area rectangle is completely filled! The width (${factorModel.topLatex}) multiplied by height (${factorModel.leftLatex}) equals the total area.`,
        status: 'factoring_complete',
        celebration: true,
      };
    }

    const x2Count = tiles.filter((t) => t.kind === 'x2').length;
    const xCount = tiles.filter((t) => t.kind === 'x').length;
    const unitCount = tiles.filter((t) => t.kind === 'unit').length;

    if (customTarget?.factoringAnalysis?.factoredLatex) {
      return {
        headline: `Building Rectangle for ${customTarget.rawString}`,
        hint: `You have ${x2Count} x² tile, ${xCount} x bars, and ${unitCount} units. Place x² in the top-left corner, split the x-bars along the top & left edges, and fill the corner with units.`,
        actionSuggestion: 'Arrange tiles into a tight solid rectangle',
        status: 'factoring_in_progress',
      };
    }

    return {
      headline: 'Form a Complete Rectangle',
      hint: 'Arrange your tiles so they form a continuous, solid rectangle with no gaps or overlaps. The outer edge lengths will be your binomial factors!',
      actionSuggestion: 'Align x² in corner, then x-bars, then units',
      status: 'factoring_in_progress',
    };
  }

  // 3. SIMPLIFY EXPRESSION ADVICE
  const breakdown = computeExpressionBreakdown(tiles);
  if (tiles.length === 0) {
    return {
      headline: 'Free Exploration & Simplification',
      hint: 'Enter an expression like 3x + 4 - 2x + 1 or spawn tiles from the left palette to explore algebraic terms.',
      status: 'setup',
    };
  }

  if (zeroPairs.length > 0) {
    return {
      headline: `${zeroPairs.length} Zero Pair${zeroPairs.length > 1 ? 's' : ''} Ready to Cancel`,
      hint: 'Matching positive and negative tiles sum to zero. Click "Cancel Zero Pairs" or drag them together to vaporize them.',
      actionSuggestion: 'Cancel Zero Pairs',
      status: 'zero_pairs',
    };
  }

  return {
    headline: `Simplified Expression: ${breakdown.simplifiedLatex}`,
    hint: 'All like terms are combined and zero pairs removed. You can test values with the substitution slider in the right panel!',
    status: 'simplifying',
  };
};
