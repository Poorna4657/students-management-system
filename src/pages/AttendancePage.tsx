import { useEffect, useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Trash2,
  Check,
  X,
  Clock,
  FileText,
  Filter,
  Save,
} from 'lucide-react';
import { api } from '@/lib/supabase';
import {
  Student,
  Course,
  Attendance,
  AttendanceStatus,
  AttendanceWithRelations,
} from '@/types';
import { formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { InlineLoader } from '@/components/Loader';
import { useToast } from '@/components/Toast';

const attendanceStatuses: { value: AttendanceStatus; label: string; icon: typeof Check; color: string }[] = [
  { value: 'present', label: 'Present', icon: Check, color: 'success' },
  { value: 'absent', label: 'Absent', icon: X, color: 'error' },
  { value: 'late', label: 'Late', icon: Clock, color: 'warning' },
  { value: 'excused', label: 'Excused', icon: FileText, color: 'gray' },
];

export function AttendancePage() {
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<string, Attendance>>({});
  const [saving, setSaving] = useState(false);

  // History
  const [history, setHistory] = useState<AttendanceWithRelations[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState({ course: 'all', status: 'all', search: '' });
  const { state: confirmState, confirm, close: closeConfirm } = useConfirmDialog();

  useEffect(() => {
    async function load() {
      try {
        const [studentsData, coursesData] = await Promise.all([
          api.students.list(),
          api.courses.list(),
        ]);
        setStudents(((studentsData ?? []) as Student[]).filter((s) => s.status === 'active'));
        setCourses(((coursesData ?? []) as Course[]).filter((c) => c.status === 'active'));
      } catch (error: any) {
        notify('error', error.message || 'Failed to load data');
      }
      setLoading(false);
    }
    load();
  }, []);

  // Load existing attendance when course/date changes
  useEffect(() => {
    if (!selectedCourse || !selectedDate) return;
    loadExistingAttendance();
  }, [selectedCourse, selectedDate]);

  const loadExistingAttendance = async () => {
    if (!selectedCourse || !selectedDate) return;
    try {
      const data = await api.attendance.getByDate(selectedCourse, selectedDate);
      const existing: Record<string, Attendance> = {};
      const marksMap: Record<string, AttendanceStatus> = {};
      (data ?? []).forEach((a: any) => {
        existing[a.student_id] = a as Attendance;
        marksMap[a.student_id] = a.status as AttendanceStatus;
      });
      setExistingAttendance(existing);
      setMarks(marksMap);
    } catch (error: any) {
      notify('error', error.message || 'Failed to load attendance');
    }
  };

  // Load history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.attendance.list();
      setHistory(((data ?? []) as AttendanceWithRelations[]).slice(0, 100));
    } catch (error: any) {
      notify('error', error.message || 'Failed to load attendance history');
    }
    setHistoryLoading(false);
  };

  const enrolledStudentIds = useMemo(() => {
    if (!selectedCourse) return [];
    // We'll just show all active students for marking since enrollment is optional
    return students.map((s) => s.id);
  }, [students, selectedCourse]);

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedDate || saving) return;
    setSaving(true);

    try {
      const attendanceRecords = Object.entries(marks).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: selectedCourse,
        date: selectedDate,
        status,
      }));

      if (attendanceRecords.length === 0) {
        notify('info', 'No attendance to save');
        setSaving(false);
        return;
      }

      // Save each attendance record
      await Promise.all(
        attendanceRecords.map((record) => api.attendance.create(record))
      );

      notify('success', `Attendance saved for ${attendanceRecords.length} students`);
      await loadExistingAttendance();
      await loadHistory();
    } catch (error: any) {
      notify('error', error.message || 'Failed to save attendance');
    }
    setSaving(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const allMarks: Record<string, AttendanceStatus> = {};
    enrolledStudentIds.forEach((id) => {
      allMarks[id] = status;
    });
    setMarks(allMarks);
  };

  const handleDeleteRecord = (record: AttendanceWithRelations) => {
    confirm({
      title: 'Delete Attendance Record',
      message: `Delete attendance for ${record.student.first_name} ${record.student.last_name} on ${formatDate(record.date)}?`,
      onConfirm: async () => {
        try {
          await api.attendance.delete(record.id);
          notify('success', 'Attendance record deleted');
          loadHistory();
        } catch (error: any) {
          notify('error', error.message || 'Failed to delete attendance');
        }
      },
    });
  };

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchesCourse = historyFilter.course === 'all' || h.course_id === historyFilter.course;
      const matchesStatus = historyFilter.status === 'all' || h.status === historyFilter.status;
      const matchesSearch =
        !historyFilter.search ||
        `${h.student.first_name} ${h.student.last_name}`
          .toLowerCase()
          .includes(historyFilter.search.toLowerCase());
      return matchesCourse && matchesStatus && matchesSearch;
    });
  }, [history, historyFilter]);

  if (loading) return <InlineLoader text="Loading attendance..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Mark and track student attendance by course and date
        </p>
      </div>

      {/* Mark attendance */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Mark Attendance</h2>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-base"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-base"
            />
          </div>
        </div>

        {!selectedCourse ? (
          <div className="py-8 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a course and date to mark attendance
            </p>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="No active students"
            description="Add students first to mark attendance."
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {enrolledStudentIds.length} students · {Object.keys(marks).length} marked
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkAll('present')}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-success-700 transition hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-900/20"
                >
                  Mark all present
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {student.first_name.charAt(0)}
                      {student.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {attendanceStatuses.map((s) => {
                      const Icon = s.icon;
                      const isSelected = marks[student.id] === s.value;
                      const colors: Record<string, string> = {
                        success: 'bg-success-600 text-white border-success-600',
                        error: 'bg-error-600 text-white border-error-600',
                        warning: 'bg-warning-500 text-white border-warning-500',
                        gray: 'bg-gray-600 text-white border-gray-600',
                      };
                      const hoverColors: Record<string, string> = {
                        success: 'text-success-600 border-success-300 hover:bg-success-50 dark:text-success-400 dark:border-success-900 dark:hover:bg-success-900/20',
                        error: 'text-error-600 border-error-300 hover:bg-error-50 dark:text-error-400 dark:border-error-900 dark:hover:bg-error-900/20',
                        warning: 'text-warning-600 border-warning-300 hover:bg-warning-50 dark:text-warning-400 dark:border-warning-900 dark:hover:bg-warning-900/20',
                        gray: 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800',
                      };
                      return (
                        <button
                          key={s.value}
                          onClick={() => handleMark(student.id, s.value)}
                          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                            isSelected ? colors[s.color] : hoverColors[s.color]
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
              <button onClick={handleSave} disabled={saving || Object.keys(marks).length === 0} className="btn-primary">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* History */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Attendance History
        </h2>

        {/* History filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student name..."
              value={historyFilter.search}
              onChange={(e) => setHistoryFilter({ ...historyFilter, search: e.target.value })}
              className="input-base pl-10"
            />
          </div>
          <select
            value={historyFilter.course}
            onChange={(e) => setHistoryFilter({ ...historyFilter, course: e.target.value })}
            className="input-base sm:w-48"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
          <select
            value={historyFilter.status}
            onChange={(e) => setHistoryFilter({ ...historyFilter, status: e.target.value })}
            className="input-base sm:w-40"
          >
            <option value="all">All Statuses</option>
            {attendanceStatuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {historyLoading ? (
          <InlineLoader text="Loading history..." />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="No attendance records"
            description="Mark attendance above and it will appear here."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredHistory.slice(0, 50).map((record) => (
                    <tr key={record.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {record.student.first_name} {record.student.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {record.course.code} - {record.course.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status} type="attendance" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRecord(record)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {filteredHistory.slice(0, 50).map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {record.student.first_name} {record.student.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {record.course.code} · {formatDate(record.date)}
                      </p>
                    </div>
                    <StatusBadge status={record.status} type="attendance" />
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(record)}
                    className="mt-2 text-xs text-error-600 dark:text-error-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        loading={confirmState.loading}
      />
    </div>
  );
}
