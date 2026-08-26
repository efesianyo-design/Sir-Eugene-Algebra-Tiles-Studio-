import React, { useState } from 'react';
import { Challenge, TileData, WorkspaceMode } from '../types';
import { BUILT_IN_CHALLENGES } from '../utils/constants';
import { MathView } from './MathView';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface PracticeChallengesProps {
  currentChallengeId: string | null;
  onSelectChallenge: (challenge: Challenge) => void;
  onClose: () => void;
  tiles: TileData[];
  onSetWorkspaceMode: (mode: WorkspaceMode) => void;
}

export const PracticeChallenges: React.FC<PracticeChallengesProps> = ({
  currentChallengeId,
  onSelectChallenge,
  onClose,
  tiles,
  onSetWorkspaceMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Challenge['category']>('simplify');
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('algebra_tiles_completed_challenges');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const currentChallenge = BUILT_IN_CHALLENGES.find((c) => c.id === currentChallengeId) || BUILT_IN_CHALLENGES[0];

  const filteredChallenges = BUILT_IN_CHALLENGES.filter((c) => c.category === selectedCategory);

  const handleCheckAnswer = () => {
    const isCorrect = currentChallenge.solutionCheck(tiles);
    if (isCorrect) {
      playSound('success');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      const updated = new Set(completedChallenges);
      updated.add(currentChallenge.id);
      setCompletedChallenges(updated);
      try {
        localStorage.setItem('algebra_tiles_completed_challenges', JSON.stringify(Array.from(updated)));
      } catch {}

      setFeedback({
        isCorrect: true,
        message: 'Correct! Brilliant work modeling the algebraic solution.',
      });
    } else {
      playSound('click');
      setFeedback({
        isCorrect: false,
        message: 'Not quite yet. Check the tile signs (+ / -) or like terms balance.',
      });
    }
  };

  const handleStartChallenge = (challenge: Challenge) => {
    setShowHint(false);
    setFeedback(null);
    if (challenge.category === 'equations') {
      onSetWorkspaceMode('equation');
    } else if (challenge.category === 'multiplication' || challenge.category === 'factoring') {
      onSetWorkspaceMode('factor');
    } else {
      onSetWorkspaceMode('freeform');
    }
    onSelectChallenge(challenge);
  };

  return (
    <div
      id="practice-challenges-modal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-base text-slate-100">Guided Math Challenges</h2>
              <p className="text-xs text-slate-400">Step-by-step interactive algebra manipulatives</p>
            </div>
          </div>
          <button
            id="close-challenges-modal-btn"
            type="button"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex border-b border-slate-800 px-4 gap-2 bg-slate-950/30 overflow-x-auto py-2">
          {(
            [
              { key: 'simplify', label: '1. Simplifying & Zero Pairs' },
              { key: 'equations', label: '2. Solving Equations' },
              { key: 'multiplication', label: '3. Area Models' },
              { key: 'factoring', label: '4. Factoring Trinomials' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              id={`tab-category-${tab.key}`}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === tab.key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              onClick={() => {
                setSelectedCategory(tab.key);
                setFeedback(null);
                setShowHint(false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Challenge Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                  Challenge
                </span>
                <h3 className="text-lg font-bold text-slate-100">{currentChallenge.title}</h3>
              </div>
              {completedChallenges.has(currentChallenge.id) && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Solved</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{currentChallenge.description}</p>

            {/* Target Mathematical Display */}
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Target Goal:</span>
              <span className="text-lg font-bold text-cyan-300">
                <MathView latex={currentChallenge.targetLatex} />
              </span>
            </div>

            {/* Hint Box */}
            {showHint ? (
              <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-lg text-xs text-amber-200 flex items-start gap-2 animate-in fade-in">
                <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{currentChallenge.hint}</span>
              </div>
            ) : (
              <button
                id="toggle-challenge-hint-btn"
                type="button"
                className="text-xs text-amber-400/90 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                onClick={() => setShowHint(true)}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need a hint?</span>
              </button>
            )}

            {/* Feedback notification */}
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                    : 'bg-red-950/80 border border-red-500 text-red-200'
                }`}
              >
                {feedback.isCorrect ? (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-red-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* List of Other Challenges in Category */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedCategory.toUpperCase()} PROBLEMS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredChallenges.map((ch) => {
                const isSelected = ch.id === currentChallenge.id;
                const isSolved = completedChallenges.has(ch.id);
                return (
                  <button
                    key={ch.id}
                    id={`challenge-item-${ch.id}`}
                    type="button"
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md ring-1 ring-cyan-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                    onClick={() => handleStartChallenge(ch)}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200">{ch.title}</div>
                      <div className="text-[11px] text-cyan-400 mt-0.5">
                        <MathView latex={ch.targetLatex} />
                      </div>
                    </div>
                    {isSolved && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            id="start-challenge-workspace-btn"
            type="button"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            onClick={onClose}
          >
            <span>Return to Workspace</span>
          </button>

          <button
            id="check-challenge-answer-btn"
            type="button"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
            onClick={handleCheckAnswer}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Check My Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
