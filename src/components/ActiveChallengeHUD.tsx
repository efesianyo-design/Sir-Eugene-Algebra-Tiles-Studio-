import React, { useState } from 'react';
import { Challenge, TileData } from '../types';
import { MathView } from './MathView';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface ActiveChallengeHUDProps {
  challenge: Challenge;
  tiles: TileData[];
  onResetChallenge: () => void;
  onNextChallenge?: () => void;
  onExitChallenge: () => void;
  onOpenChallengesModal: () => void;
}

export const ActiveChallengeHUD: React.FC<ActiveChallengeHUDProps> = ({
  challenge,
  tiles,
  onResetChallenge,
  onNextChallenge,
  onExitChallenge,
  onOpenChallengesModal,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const handleCheck = () => {
    const isCorrect = challenge.solutionCheck(tiles);
    if (isCorrect) {
      playSound('success');
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.3 },
        });
      } catch {}

      try {
        const saved = localStorage.getItem('algebra_tiles_completed_challenges');
        const set = saved ? new Set(JSON.parse(saved)) : new Set();
        set.add(challenge.id);
        localStorage.setItem('algebra_tiles_completed_challenges', JSON.stringify(Array.from(set)));
      } catch {}

      setFeedback({
        isCorrect: true,
        message: 'Correct! Excellent modeling.',
      });
    } else {
      playSound('click');
      setFeedback({
        isCorrect: false,
        message: 'Not quite yet. Check tile quantities, positions, or +/- signs.',
      });
    }
  };

  const categoryLabels = {
    simplify: 'Simplifying & Zero Pairs',
    equations: 'Solving Linear Equations',
    multiplication: 'Area Model Multiplication',
    factoring: 'Factoring Trinomials',
  };

  return (
    <div
      id="active-challenge-hud"
      className="absolute top-3 left-1/2 -translate-x-1/2 w-[94%] max-w-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3 z-30 flex flex-col gap-2 text-slate-100 animate-in slide-in-from-top-4 duration-300"
    >
      {/* Top row: Challenge title, category & controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">
                {categoryLabels[challenge.category]}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 truncate">{challenge.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id="hud-hint-btn"
            type="button"
            title="Toggle Hint"
            className={`min-h-[38px] min-w-[38px] p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors ${
              showHint
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            onClick={() => setShowHint(!showHint)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            id="hud-reset-btn"
            type="button"
            title="Reset Problem Setup"
            className="min-h-[38px] min-w-[38px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl text-slate-300 text-xs font-semibold flex items-center justify-center transition-colors"
            onClick={() => {
              setFeedback(null);
              setShowHint(false);
              onResetChallenge();
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="hud-exit-btn"
            type="button"
            title="Exit Challenge"
            className="min-h-[38px] min-w-[38px] p-2 bg-slate-800 hover:bg-red-950/80 active:scale-95 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
            onClick={onExitChallenge}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description & Target Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <p className="leading-relaxed text-xs">{challenge.description}</p>
        <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex-shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Target:</span>
          <span className="font-bold text-cyan-300 text-xs font-mono">
            <MathView latex={challenge.targetLatex} />
          </span>
        </div>
      </div>

      {/* Hint Accordion */}
      {showHint && (
        <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>{challenge.hint}</p>
        </div>
      )}

      {/* Feedback & Check Answer Action Bar */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex-1 min-w-0">
          {feedback && (
            <div
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border truncate ${
                feedback.isCorrect
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-red-950/80 text-red-300 border-red-500/50'
              }`}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span className="truncate">{feedback.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {feedback?.isCorrect && onNextChallenge ? (
            <button
              id="hud-next-challenge-btn"
              type="button"
              className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              onClick={() => {
                setFeedback(null);
                setShowHint(false);
                onNextChallenge();
              }}
            >
              <span>Next Puzzle</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="hud-check-answer-btn"
              type="button"
              className="min-h-[40px] px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              onClick={handleCheck}
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Check Answer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
