import { StudentProfile, StudentActivityLog } from '../types';

const PROFILE_STORAGE_KEY = 'algebra_student_profile_v1';
const LOGS_STORAGE_KEY = 'algebra_student_learning_logs_v1';
const ADMIN_PIN_KEY = 'algebra_admin_portal_pin_v1';
export const DEFAULT_ADMIN_PIN = '1234';

export const getStudentProfile = (): StudentProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStudentProfile = (profile: StudentProfile): void => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save student profile', e);
  }
};

export const getAdminPIN = (): string => {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const setAdminPIN = (pin: string): void => {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, pin);
  } catch (e) {
    console.warn('Failed to set admin pin', e);
  }
};

export const getStudentLogs = (): StudentActivityLog[] => {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const logStudentActivity = (
  entry: Omit<StudentActivityLog, 'id' | 'timestamp' | 'studentName' | 'studentId'> & {
    studentName?: string;
    studentId?: string;
    studentAvatar?: string;
    classOrHouse?: string;
    level?: string;
  }
): StudentActivityLog => {
  const profile = getStudentProfile();
  const studentName = entry.studentName || profile?.name || 'Anonymous Student';
  const studentId = entry.studentId || profile?.studentId || profile?.classOrHouse || 'N/A';
  const studentAvatar = entry.studentAvatar || profile?.avatarSeed || '🌟';
  const classOrHouse = entry.classOrHouse || profile?.classOrHouse || profile?.studentId || '—';
  const level = entry.level || profile?.level || profile?.grade || 'Form 1';

  const newLog: StudentActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    studentName,
    studentId,
    studentAvatar,
    classOrHouse,
    level,
    activityType: entry.activityType,
    question: entry.question,
    result: entry.result,
    timeTakenSeconds: entry.timeTakenSeconds,
    status: entry.status || 'success',
  };

  try {
    const existing = getStudentLogs();
    // Prepend to show latest first, keep up to 500 entries
    const updated = [newLog, ...existing].slice(0, 500);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save student log', e);
  }

  return newLog;
};

export const clearStudentLogs = (): void => {
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear student logs', e);
  }
};

export const exportLogsToCSV = (): void => {
  const logs = getStudentLogs();
  if (logs.length === 0) {
    alert('No student logs recorded yet to export.');
    return;
  }

  const headers = ['Timestamp', 'Date & Time', 'Avatar', 'Student Name', 'Level', 'Class / House / ID', 'Activity Type', 'Question', 'Result', 'Status'];
  const rows = logs.map((log) => {
    const dateStr = new Date(log.timestamp).toLocaleString();
    const cleanQuestion = `"${(log.question || '').replace(/"/g, '""')}"`;
    const cleanResult = `"${(log.result || '').replace(/"/g, '""')}"`;
    const cleanName = `"${(log.studentName || '').replace(/"/g, '""')}"`;
    const cleanClass = `"${(log.classOrHouse || log.studentId || '').replace(/"/g, '""')}"`;
    const cleanLevel = `"${(log.level || '').replace(/"/g, '""')}"`;
    const cleanAvatar = `"${(log.studentAvatar || '🌟').replace(/"/g, '""')}"`;

    return [
      log.timestamp,
      `"${dateStr}"`,
      cleanAvatar,
      cleanName,
      cleanLevel,
      cleanClass,
      log.activityType,
      cleanQuestion,
      cleanResult,
      log.status,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Sir_Eugene_Algebra_Student_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
