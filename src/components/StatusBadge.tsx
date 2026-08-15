import { StudentStatus, CourseStatus, EnrollmentStatus, AttendanceStatus } from '@/types';

const studentStatusStyles: Record<StudentStatus, string> = {
  active: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  graduated: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  suspended: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
};

const courseStatusStyles: Record<CourseStatus, string> = {
  active: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const enrollmentStatusStyles: Record<EnrollmentStatus, string> = {
  enrolled: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  completed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  dropped: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
};

const attendanceStatusStyles: Record<AttendanceStatus, string> = {
  present: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  absent: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  late: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  excused: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: 'student' | 'course' | 'enrollment' | 'attendance';
}) {
  let className = '';
  if (type === 'student') className = studentStatusStyles[status as StudentStatus] ?? '';
  if (type === 'course') className = courseStatusStyles[status as CourseStatus] ?? '';
  if (type === 'enrollment')
    className = enrollmentStatusStyles[status as EnrollmentStatus] ?? '';
  if (type === 'attendance')
    className = attendanceStatusStyles[status as AttendanceStatus] ?? '';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${className}`}
    >
      {status}
    </span>
  );
}
