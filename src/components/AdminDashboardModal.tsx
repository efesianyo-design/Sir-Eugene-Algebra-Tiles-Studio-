import React, { useState, useEffect, useMemo } from 'react';
import { StudentActivityLog } from '../types';
import {
  getAdminPIN,
  setAdminPIN,
  getStudentLogs,
  clearStudentLogs,
  exportLogsToCSV,
  DEFAULT_ADMIN_PIN,
} from '../utils/studentLogs';
import { playSound } from '../utils/audio';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Search,
  RefreshCw,
  X,
  Award,
  CheckCircle2,
  KeyRound,
  FileSpreadsheet,
  Check,
  TrendingUp,
  Scale,
  Grid,
  Zap,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [logs, setLogs] = useState<StudentActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        setLogs(getStudentLogs());
      }
    } else {
      setPinInput('');
      setPinError(false);
      setShowChangePin(false);
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getAdminPIN();
    if (pinInput.trim() === correctPin || pinInput.trim() === DEFAULT_ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      setLogs(getStudentLogs());
      playSound('success');
    } else {
      setPinError(true);
      playSound('clear');
    }
  };

  const handleKeypadDigit = (digit: string) => {
    playSound('click');
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setPinError(false);

      const correctPin = getAdminPIN();
      if (nextPin === correctPin || nextPin === DEFAULT_ADMIN_PIN) {
        setIsAuthenticated(true);
        setLogs(getStudentLogs());
        playSound('success');
      }
    }
  };

  const handleKeypadBackspace = () => {
    playSound('click');
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setAdminPIN(newPin.trim());
      setPinChangeSuccess(true);
      playSound('success');
      setTimeout(() => {
        setPinChangeSuccess(false);
        setShowChangePin(false);
        setNewPin('');
      }, 1500);
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to permanently clear all student activity logs?')) {
      clearStudentLogs();
      setLogs([]);
      playSound('clear');
    }
  };

  const handleRefreshLogs = () => {
    playSound('click');
    setLogs(getStudentLogs());
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.studentId && log.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.question && log.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.result && log.result.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = filterType === 'all' || log.activityType === filterType;
      return matchesSearch && matchesType;
    });
  }, [logs, searchQuery, filterType]);

  // Topic Breakdown & Pass Rate Analytics
  const topicStats = useMemo(() => {
    const calcTopic = (type: string | string[]) => {
      const matchLogs = logs.filter((l) =>
        Array.isArray(type) ? type.includes(l.activityType) : l.activityType === type
      );
      const total = matchLogs.length;
      const successes = matchLogs.filter((l) => l.status === 'success').length;
      const passRate = total > 0 ? Math.round((successes / total) * 100) : 100;
      return { total, successes, passRate };
    };

    return {
      factoring: calcTopic('factoring_completed'),
      equations: calcTopic('equation_solved'),
      zeroPairs: calcTopic(['zero_pairs_cancelled', 'zero_pairs_mastered']),
      challenges: calcTopic(['challenge_completed', 'challenge_solved']),
      totalEvents: logs.length,
      totalSuccesses: logs.filter((l) => l.status === 'success').length,
    };
  }, [logs]);

  return (
    <div
      id="admin-dashboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div
        id="admin-dashboard-card"
        className="w-full max-w-5xl max-h-[90dvh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg text-slate-950 font-black">
              <ShieldCheck className="w-5 h-5 font-black text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">Super Admin Portal</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Teacher & Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Student learning analytics, pass rates & CSV export for grading</p>
            </div>
          </div>

          <button
            id="close-admin-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* PIN Entry Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-amber-400">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white text-center">Teacher / Admin Authentication</h3>
            <p className="text-xs text-slate-400 text-center max-w-sm mt-1 mb-6">
              Enter the 4-digit Administrator PIN to view student records and activity metrics (Default: <code className="text-amber-400 font-bold">1234</code>).
            </p>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs flex flex-col items-center gap-4">
              <div className="relative w-full">
                <input
                  id="admin-pin-input"
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Enter PIN (1234)"
                  className={`w-full text-center text-xl tracking-widest font-mono bg-slate-950 border ${
                    pinError ? 'border-rose-500 ring-2 ring-rose-500/30 animate-shake' : 'border-slate-700 focus:border-amber-400'
                  } rounded-2xl px-4 py-3 text-white focus:outline-none transition-all`}
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Incorrect PIN. Please try again or use default (1234).</span>
                </div>
              )}

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-2 w-full mt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    id={`pin-keypad-${num}`}
                    type="button"
                    onClick={() => handleKeypadDigit(num)}
                    className="min-h-[44px] bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-mono font-bold text-lg rounded-xl border border-slate-700 transition-all flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  id="pin-keypad-clear"
                  type="button"
                  onClick={() => setPinInput('')}
                  className="min-h-[44px] bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  id="pin-keypad-0"
                  type="button"
                  onClick={() => handleKeypadDigit('0')}
                  className="min-h-[44px] bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-white font-mono font-bold text-lg rounded-xl border border-slate-700 transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  id="pin-keypad-backspace"
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="min-h-[44px] bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <button
                id="submit-admin-pin-btn"
                type="submit"
                className="w-full min-h-[44px] py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Admin Portal</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Topic Pass Rates & Metric Cards Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/70 border-b border-slate-800 flex-shrink-0">
              {/* Factoring */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Grid className="w-3 h-3 text-emerald-400" /> Factoring Area
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                    {topicStats.factoring.passRate}% Pass
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                  {topicStats.factoring.successes}
                  <span className="text-xs font-normal text-slate-500 ml-1">completed</span>
                </div>
              </div>

              {/* Equation Mat */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-400" /> Linear Equations
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                    {topicStats.equations.passRate}% Pass
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                  {topicStats.equations.successes}
                  <span className="text-xs font-normal text-slate-500 ml-1">solved</span>
                </div>
              </div>

              {/* Zero Pairs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> Zero Pairs
                  </span>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/15 px-1.5 py-0.2 rounded">
                    {topicStats.zeroPairs.passRate}% Pass
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">
                  {topicStats.zeroPairs.successes}
                  <span className="text-xs font-normal text-slate-500 ml-1">cancelled</span>
                </div>
              </div>

              {/* Overall Total */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-indigo-400" /> Total Activity
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.2 rounded">
                    {logs.length > 0 ? Math.round((topicStats.totalSuccesses / logs.length) * 100) : 100}% Pass
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
                  {topicStats.totalEvents}
                  <span className="text-xs font-normal text-slate-500 ml-1">events</span>
                </div>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-slate-900/80 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-search-logs-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, ID, problem or solution..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <select
                  id="admin-filter-type-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Topics & Actions</option>
                  <option value="factoring_completed">Factoring Trinomials</option>
                  <option value="equation_solved">Linear Equations Solved</option>
                  <option value="zero_pairs_cancelled">Zero Pairs Cancelled</option>
                  <option value="challenge_solved">Puzzles & Challenges</option>
                </select>
              </div>

              {/* Action Buttons: Export CSV, Refresh, Change PIN, Clear */}
              <div className="flex items-center gap-2">
                <button
                  id="admin-export-csv-btn"
                  type="button"
                  onClick={exportLogsToCSV}
                  className="min-h-[36px] px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  title="Export all student activity logs to grading spreadsheet (.CSV)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  id="admin-refresh-logs-btn"
                  type="button"
                  onClick={handleRefreshLogs}
                  className="min-h-[36px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                  title="Refresh Log Feed"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  id="admin-toggle-change-pin-btn"
                  type="button"
                  onClick={() => setShowChangePin(!showChangePin)}
                  className="min-h-[36px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Change PIN</span>
                </button>

                <button
                  id="admin-clear-logs-btn"
                  type="button"
                  onClick={handleClearLogs}
                  className="min-h-[36px] p-2 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-xl border border-red-800/80 transition-colors"
                  title="Clear All Logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Change PIN Dropdown Form */}
            {showChangePin && (
              <div className="bg-amber-950/40 border-b border-amber-500/40 p-4 flex items-center justify-between gap-4 animate-fade-in flex-shrink-0">
                <form onSubmit={handleChangePinSubmit} className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-bold text-amber-300 whitespace-nowrap">New 4-Digit PIN:</span>
                  <input
                    id="admin-new-pin-input"
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="e.g. 5678"
                    className="bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-white w-32 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    autoFocus
                  />
                  <button
                    id="admin-save-new-pin-btn"
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Save PIN
                  </button>
                </form>
                {pinChangeSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> PIN Updated Successfully!
                  </span>
                )}
              </div>
            )}

            {/* Activity Logs Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <Award className="w-12 h-12 mb-2 text-slate-600" />
                  <p className="text-sm font-bold text-slate-400">No student activity records match your query.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    As students solve equations, factor polynomials, and cancel zero pairs, graded records populate here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Level / Form</th>
                        <th className="py-2.5 px-3">Class / House / ID</th>
                        <th className="py-2.5 px-3">Topic / Action</th>
                        <th className="py-2.5 px-3">Question / Expression</th>
                        <th className="py-2.5 px-3">Result / Solved Value</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-sans">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                            <span className="text-[10px] text-slate-600">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xs flex-shrink-0">
                                {log.studentAvatar || '🌟'}
                              </span>
                              <span>{log.studentName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-cyan-300 whitespace-nowrap">
                            {log.level || 'Form 1'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {log.classOrHouse || log.studentId || '—'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                log.activityType === 'factoring_completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : log.activityType === 'equation_solved'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {log.activityType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-300">{log.question}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{log.result || '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{log.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
