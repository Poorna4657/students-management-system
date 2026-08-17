import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, CalendarCheck, GraduationCap, TrendingUp, UserPlus, BookPlus } from 'lucide-react';
import { api } from '@/lib/supabase';
import { Student, Course, Attendance } from '@/types';
import { formatDate, getInitials, getFullName } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { InlineLoader } from '@/components/Loader';
import { EmptyState } from '@/components/EmptyState';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  attendanceToday: { present: number; absent: number; late: number; total: number };
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<(Attendance & { student: Pick<Student, 'first_name' | 'last_name'>; course: Pick<Course, 'code' | 'title'> })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [studentsData, coursesData, enrollmentsData, attendanceData] = await Promise.all([
          api.students.list(),
          api.courses.list(),
          api.enrollments.list(),
          api.attendance.list(),
        ]);

        const students = (studentsData ?? []) as Student[];
        const courses = (coursesData ?? []) as Course[];
        const enrollments = (enrollmentsData ?? []) as any[];
        const attendance = (attendanceData ?? []) as any[];

        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendance.filter((a: any) => a.date === today);

        setStats({
          totalStudents: students.length,
          activeStudents: students.filter((s) => s.status === 'active').length,
          totalCourses: courses.length,
          activeCourses: courses.filter((c) => c.status === 'active').length,
          totalEnrollments: enrollments.length,
          attendanceToday: {
            present: todayRecords.filter((a: any) => a.status === 'present').length,
            absent: todayRecords.filter((a: any) => a.status === 'absent').length,
            late: todayRecords.filter((a: any) => a.status === 'late').length,
            total: todayRecords.length,
          },
        });

        setRecentStudents(
          [...students]
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
            .slice(0, 5)
        );
        setRecentAttendance(attendance.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <InlineLoader text="Loading dashboard..." />;

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      sub: `${stats?.activeStudents ?? 0} active`,
      icon: Users,
      color: 'primary',
      onClick: () => navigate('/students'),
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      sub: `${stats?.activeCourses ?? 0} active`,
      icon: BookOpen,
      color: 'secondary',
      onClick: () => navigate('/courses'),
    },
    {
      label: 'Enrollments',
      value: stats?.totalEnrollments ?? 0,
      sub: 'total records',
      icon: GraduationCap,
      color: 'accent',
      onClick: () => navigate('/courses'),
    },
    {
      label: 'Attendance Today',
      value: stats?.attendanceToday.total ?? 0,
      sub: `${stats?.attendanceToday.present ?? 0} present`,
      icon: CalendarCheck,
      color: 'success',
      onClick: () => navigate('/attendance'),
    },
  ];

  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400',
  };

  const attendanceRate =
    stats && stats.attendanceToday.total > 0
      ? Math.round((stats.attendanceToday.present / stats.attendanceToday.total) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your institution at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.onClick}
              className="card p-5 text-left transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorMap[card.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{card.label}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{card.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/students')} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
          <button onClick={() => navigate('/courses')} className="btn-secondary">
            <BookPlus className="h-4 w-4" />
            Add Course
          </button>
          <button onClick={() => navigate('/attendance')} className="btn-secondary">
            <CalendarCheck className="h-4 w-4" />
            Mark Attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent students */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recently Added Students
            </h2>
            <button
              onClick={() => navigate('/students')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all
            </button>
          </div>
          {recentStudents.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No students yet"
              description="Students you add will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {getInitials(student.first_name, student.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getFullName(student.first_name, student.last_name)}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {student.email}
                    </p>
                  </div>
                  <StatusBadge status={student.status} type="student" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance + rate */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recent Attendance
            </h2>
            {attendanceRate !== null && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success-600 dark:text-success-400">
                <TrendingUp className="h-3.5 w-3.5" />
                {attendanceRate}% present today
              </div>
            )}
          </div>
          {recentAttendance.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6" />}
              title="No attendance records"
              description="Attendance you mark will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getFullName(record.student.first_name, record.student.last_name)}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {record.course.code} - {record.course.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={record.status} type="attendance" />
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(record.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
