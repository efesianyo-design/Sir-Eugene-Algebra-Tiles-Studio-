import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { getStudentProfile, saveStudentProfile } from '../utils/studentLogs';
import { playSound } from '../utils/audio';
import { X, ShieldCheck, User, GraduationCap, BookOpen, Sparkles, LogOut } from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  isMandatoryGate?: boolean;
  onClose: () => void;
  onProfileSaved: (profile: StudentProfile) => void;
  onOpenAdminPortal?: () => void;
  onSignOut?: () => void;
}

const AVATARS = ['🌟', '🦉', '🚀', '📐', '🧠', '🔬', '💡', '⚡'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  isMandatoryGate = false,
  onClose,
  onProfileSaved,
  onOpenAdminPortal,
  onSignOut,
}) => {
  const [name, setName] = useState('');
  const [classOrHouse, setClassOrHouse] = useState('');
  const [level, setLevel] = useState<'Form 1' | 'Form 2' | 'Form 3'>('Form 1');
  const [avatarSeed, setAvatarSeed] = useState(AVATARS[4]); // Default to 🧠
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing = getStudentProfile();
      if (existing) {
        setName(existing.name || '');
        setClassOrHouse(existing.classOrHouse || existing.studentId || '');
        setLevel(
          (existing.level as 'Form 1' | 'Form 2' | 'Form 3') ||
            (existing.grade as 'Form 1' | 'Form 2' | 'Form 3') ||
            'Form 1'
        );
        if (existing.avatarSeed) setAvatarSeed(existing.avatarSeed);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full student name.');
      return;
    }
    if (!classOrHouse.trim()) {
      setError('Please enter your class, house, or student ID.');
      return;
    }

    const existing = getStudentProfile();
    const profile: StudentProfile = {
      id: existing?.id || `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      classOrHouse: classOrHouse.trim(),
      studentId: classOrHouse.trim(),
      level,
      grade: level,
      avatarSeed,
      joinedAt: existing?.joinedAt || Date.now(),
    };

    saveStudentProfile(profile);
    playSound('success');
    onProfileSaved(profile);
    onClose();
  };

  return (
    <div
      id="student-entry-gate-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="student-entry-card"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 relative animate-in fade-in zoom-in-95 duration-200"
      >
        {!isMandatoryGate && (
          <button
            id="close-student-gate-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Dynamic Avatar Brand Header */}
        <div className="flex items-center space-x-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            {avatarSeed}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              SIR EUGENE TECHNOLOGIES
            </div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              Student Studio Gate <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Welcome to the high-performance Algebra Tiles Studio. Enter your student credentials to log progress, model equations, factor polynomials, and access Ghanaian SHS challenges.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> FULL NAME
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              placeholder="e.g. Kwame Mensah / Ama Osei"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-colors"
            />
          </div>

          {/* Level & Class/House/ID Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" /> LEVEL
              </label>
              <select
                id="student-level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as 'Form 1' | 'Form 2' | 'Form 3')}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-slate-800 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Form 1">Form 1 (Year 1 SHS)</option>
                <option value="Form 2">Form 2 (Year 2 SHS)</option>
                <option value="Form 3">Form 3 (Year 3 SHS)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> CLASS / HOUSE / ID
              </label>
              <input
                id="student-class-input"
                type="text"
                required
                placeholder="e.g. Form 1 Science B / House 4"
                value={classOrHouse}
                onChange={(e) => {
                  setClassOrHouse(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* 8 Math Avatars Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              CHOOSE AVATAR BADGE
            </label>
            <div className="flex gap-1.5 justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => {
                    setAvatarSeed(av);
                    playSound('click');
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform cursor-pointer ${
                    avatarSeed === av
                      ? 'bg-blue-100 border-2 border-blue-600 scale-110 shadow-xs'
                      : 'hover:bg-slate-200'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            id="enter-studio-submit-btn"
            type="submit"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            LAUNCH ALGEBRA TILES WORKSPACE
          </button>

          {/* Optional Sign Out Button when editing profile */}
          {!isMandatoryGate && onSignOut && (
            <button
              id="sign-out-student-btn"
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch / Sign Out Student</span>
            </button>
          )}
        </form>

        {/* Footer: Teacher / Administrator Super Admin Portal Link */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium">Teacher / Administrator?</span>
          <button
            id="gate-open-admin-link"
            type="button"
            onClick={() => {
              playSound('click');
              if (onOpenAdminPortal) {
                onOpenAdminPortal();
              }
            }}
            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Portal (PIN: 1234)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
