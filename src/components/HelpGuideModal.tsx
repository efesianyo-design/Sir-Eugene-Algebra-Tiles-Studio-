import React from 'react';
import { X, HelpCircle, Sparkles, Scale, Layers, Smartphone } from 'lucide-react';

interface HelpGuideModalProps {
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ onClose }) => {
  return (
    <div
      id="help-guide-modal"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-base text-slate-800">How Algebra Tiles Work</h2>
              <p className="text-xs text-slate-500">Interactive visual manipulatives guide</p>
            </div>
          </div>
          <button
            id="close-help-modal-btn"
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          {/* Section 1: Tile Definitions */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>1. Tile Dimensions & Dimensions Model</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Each tile represents a geometric area corresponding to an algebraic quantity:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-amber-400 text-amber-900 font-bold flex items-center justify-center text-[10px]">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-800">Unit (1 × 1)</div>
                  <div className="text-[10px] text-slate-400">Value = 1</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-4 h-10 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">
                  x
                </div>
                <div>
                  <div className="font-bold text-slate-800">x Bar (1 × x)</div>
                  <div className="text-[10px] text-slate-400">Length = x</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded bg-blue-500 text-white font-bold flex items-center justify-center text-[10px]">
                  x²
                </div>
                <div>
                  <div className="font-bold text-slate-800">x² Square (x × x)</div>
                  <div className="text-[10px] text-slate-400">Area = x²</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-4 h-12 rounded bg-blue-400 text-white font-bold flex items-center justify-center text-[10px]">
                  y
                </div>
                <div>
                  <div className="font-bold text-slate-800">y Bar (1 × y)</div>
                  <div className="text-[10px] text-slate-400">Second variable</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-11 h-11 rounded bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                  y²
                </div>
                <div>
                  <div className="font-bold text-slate-800">y² Square (y × y)</div>
                  <div className="text-[10px] text-slate-400">Area = y²</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="w-8 h-11 rounded bg-purple-500 text-white font-bold flex items-center justify-center text-[10px]">
                  xy
                </div>
                <div>
                  <div className="font-bold text-slate-800">xy Rect (x × y)</div>
                  <div className="text-[10px] text-slate-400">Product area</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Zero Pairs */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>2. Positive / Negative Signs & Zero Pairs</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every tile has a positive form (gold/green/blue) and a negative form (red). When a positive tile and a negative tile of the same type meet, their sum is zero:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-indigo-700 text-xs font-semibold">
              (+x) + (-x) = 0 &nbsp;&nbsp;|&nbsp;&nbsp; (+1) + (-1) = 0 &nbsp;&nbsp;|&nbsp;&nbsp; (+x²) + (-x²) = 0
            </div>
          </section>

          {/* Section 3: Gestures & Touch */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>3. Touch, Gestures & Pointer Controls</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">• Drag:</span>
                <span>Touch and slide any tile to move. Dragging near other tiles magnetically snaps them edge-to-edge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">• Double-Tap / Flip (F):</span>
                <span>Double-tap any tile or click the flip button to toggle its sign from + to -.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">• Rotate (R):</span>
                <span>Rotate x and y bars between vertical and horizontal orientations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">• Box Selection:</span>
                <span>Drag on empty canvas to draw a selection marquee and move or flip multiple tiles at once.</span>
              </li>
            </ul>
          </section>

          {/* Section 4: Workspace Modes */}
          <section className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>4. Modes: Equation Mat & Factor Tracks</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              - <strong>Equation Mat:</strong> Balances Left Side = Right Side. Perform operations on both sides to isolate the variable.<br />
              - <strong>Factor Track:</strong> Place binomial dimensions on top and left to model geometric rectangle multiplication and factoring.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            id="close-help-guide-confirm-btn"
            type="button"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition-colors shadow-sm"
            onClick={onClose}
          >
            Got It, Let's Explore!
          </button>
        </div>
      </div>
    </div>
  );
};
