import React, { useState } from 'react';
import { TileData, WorkspaceMode } from '../types';
import { getSocraticAdvice, SocraticAdvice } from '../utils/socraticAdvisor';
import { FactoringAnalysis } from '../utils/mathParser';
import { playSound } from '../utils/audio';
import {
  Bot,
  Sparkles,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface SocraticCoachBarProps {
  tiles: TileData[];
  mode: WorkspaceMode;
  customTarget?: { rawString: string; factoringAnalysis?: FactoringAnalysis | null } | null;
}

export const SocraticCoachBar: React.FC<SocraticCoachBarProps> = ({
  tiles,
  mode,
  customTarget,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [deepAiHint, setDeepAiHint] = useState<string | null>(null);

  const advice: SocraticAdvice = getSocraticAdvice(tiles, mode, customTarget);

  const handleAskGemini = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setIsAiLoading(true);
    setDeepAiHint(null);
    setIsExpanded(true);

    try {
      const boardSummary = `Mode: ${mode}. Tiles: ${tiles.length} total. Board advice: ${advice.headline}. Target: ${customTarget?.rawString || 'None'}`;
      
      const response = await fetch('/api/socratic-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          boardSummary,
          currentHint: advice.hint,
          targetQuestion: customTarget?.rawString,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hint) {
          setDeepAiHint(data.hint);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('Instant local pedagogical response engine', e);
    }

    setTimeout(() => {
      setDeepAiHint(
        `💡 Guiding thought: What algebraic operation maintains balance when done identically to both sides?`
      );
      setIsAiLoading(false);
    }, 400);
  };

  return (
    <div
      id="socratic-coach-ribbon"
      className="bg-slate-900/95 border-t border-slate-800 text-slate-200 select-none z-30 flex flex-col flex-shrink-0 transition-all shadow-md"
    >
      {/* Slim Single-Line Docked Ribbon */}
      <div
        className="h-9 px-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-850 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-xs flex-shrink-0">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wide flex-shrink-0 hidden sm:inline">
            Coach:
          </span>
          <p className="text-xs font-semibold text-slate-200 truncate">
            {advice.headline}
          </p>
          {advice.celebration && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold flex-shrink-0 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Solved!
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleAskGemini}
            disabled={isAiLoading}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/40 rounded transition-all active:scale-95 shadow-xs"
            title="Ask AI for deeper Socratic question"
          >
            {isAiLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400" />
            )}
            <span className="hidden md:inline">Ask Coach</span>
          </button>

          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-white"
            title={isExpanded ? 'Collapse Hint' : 'Expand Hint'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Detailed Hint Panel */}
      {isExpanded && (
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800 flex items-start gap-2.5 text-xs animate-fadeIn">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-slate-300 leading-relaxed font-medium">
              {deepAiHint || advice.hint}
            </p>
            {advice.actionSuggestion && (
              <p className="text-cyan-300 font-semibold italic">
                Suggestion: {advice.actionSuggestion}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
