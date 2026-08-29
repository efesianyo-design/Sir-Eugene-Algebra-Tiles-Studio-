import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';
import { MathView } from './MathView';

interface CelebrationToastProps {
  equationLatex: string;
  message?: string;
  onClose: () => void;
}

export const CelebrationToast: React.FC<CelebrationToastProps> = ({
  equationLatex,
  message = 'Excellent! Factored Correctly:',
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6500);
    return () => clearTimeout(timer);
  }, [equationLatex, onClose]);

  return (
    <aside
      id="factoring-celebration-toast"
      role="status"
      aria-label="Celebration message"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-bounce-in max-w-[92vw] sm:max-w-md shadow-2xl"
    >
      <div className="bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-teal-950/95 border-2 border-emerald-400/80 rounded-2xl p-4 shadow-[0_0_35px_rgba(16,185,129,0.45)] backdrop-blur-xl flex items-center gap-3.5 text-white">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg flex-shrink-0 animate-pulse">
          <Sparkles className="w-6 h-6 fill-current" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{message}</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 truncate font-mono">
            <MathView latex={equationLatex} />
          </div>
        </div>

        <button
          id="close-celebration-toast-btn"
          type="button"
          onClick={onClose}
          className="text-emerald-400/70 hover:text-emerald-200 p-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
