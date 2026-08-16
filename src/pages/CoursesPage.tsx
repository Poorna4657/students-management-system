import { useEffect, useState, useMemo, FormEvent } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { api } from '@/lib/supabase';
import { Course, CourseStatus, CourseInput, Student, Enrollment } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { InlineLoader } from '@/components/Loader';
import { useToast } from '@/components/Toast';

const statusOptions: CourseStatus[] = ['active', 'archived'];

const emptyForm: CourseInput = {
  code: '',
  title: '',
  description: '',
  credits: 3,
  instructor: '',
  capacity: 30,
  status: 'active',
};

export function CoursesPage() {
  const { notify } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirmDialog();

  // Enrollment modal state
  const [enrollModalCourse, setEnrollModalCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  const loadCourses = async () => {
    setLoading(true);
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        api.courses.list(),
        api.enrollments.list(),
      ]);
      setCourses((coursesData ?? []) as Course[]);
      
      const counts: Record<string, number> = {};
      (enrollmentsData ?? []).forEach((e: any) => {
        counts[e.course_id] = (counts[e.course_id] ?? 0) + 1;
      });
      setEnrollmentCounts(counts);
    } catch (error: any) {
      notify('error', error.message || 'Failed to load courses');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.instructor ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      code: course.code,
      title: course.title,
      description: course.description ?? '',
      credits: course.credits,
      instructor: course.instructor ?? '',
      capacity: course.capacity,
      status: course.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = {
      ...form,
      description: form.description || null,
      instructor: form.instructor || null,
    };

    try {
      if (editing) {
        await api.courses.update(editing.id, payload);
        notify('success', 'Course updated successfully');
      } else {
        await api.courses.create(payload);
        notify('success', 'Course added successfully');
      }
      setModalOpen(false);
      loadCourses();
    } catch (error: any) {
      notify('error', error.message || 'Failed to save course');
    }
    setSaving(false);
  };

  const handleDelete = (course: Course) => {
    confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete ${course.code} - ${course.title}? This will also remove all enrollments and attendance for this course.`,
      onConfirm: async () => {
        try {
          await api.courses.delete(course.id);
          notify('success', 'Course deleted');
          loadCourses();
        } catch (error: any) {
          notify('error', error.message || 'Failed to delete course');
        }
      },
    });
  };

  const openEnrollments = async (course: Course) => {
    setEnrollModalCourse(course);
    try {
      const [enrollmentsData, studentsData] = await Promise.all([
        api.enrollments.getByCourse(course.id),
        api.students.list(),
      ]);
      setEnrollments((enrollmentsData ?? []) as Enrollment[]);
      setAllStudents(((studentsData ?? []) as Student[]).filter((s: Student) => s.status === 'active'));
      setSelectedStudent('');
    } catch (error: any) {
      notify('error', error.message || 'Failed to load enrollments');
    }
  };

  const handleEnroll = async () => {
    if (!enrollModalCourse || !selectedStudent || enrollLoading) return;
    setEnrollLoading(true);
    try {
      await api.enrollments.create({
        student_id: selectedStudent,
        course_id: enrollModalCourse.id,
        status: 'enrolled',
      });
      notify('success', 'Student enrolled');
      await openEnrollments(enrollModalCourse);
      loadCourses();
    } catch (error: any) {
      const message = error.message?.includes('duplicate') ? 'Student already enrolled' : error.message;
      notify('error', message || 'Failed to enroll student');
    }
    setEnrollLoading(false);
  };

  const handleUnenroll = async (enrollmentId: string) => {
    if (!enrollModalCourse) return;
    try {
      await api.enrollments.delete(enrollmentId);
      notify('success', 'Student removed from course');
      await openEnrollments(enrollModalCourse);
      loadCourses();
    } catch (error: any) {
      notify('error', error.message || 'Failed to remove student');
    }
  };

  const enrolledStudentIds = enrollments.map((e) => e.student_id);
  const availableStudents = allStudents.filter((s) => !enrolledStudentIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {courses.length} total · {filtered.length} shown
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Course
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, title, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base pl-10 pr-8"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <InlineLoader text="Loading courses..." />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title={search || statusFilter !== 'all' ? 'No matching courses' : 'No courses yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Click "Add Course" to create your first course.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <button onClick={openAdd} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add Course
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => {
            const count = enrollmentCounts[course.id] ?? 0;
            const full = count >= course.capacity;
            return (
              <div key={course.id} className="card flex flex-col p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{course.code}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</p>
                    </div>
                  </div>
                  <StatusBadge status={course.status} type="course" />
                </div>

                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {course.description}
                  </p>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  {course.instructor && (
                    <p>
                      <span className="font-medium">Instructor:</span> {course.instructor}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Capacity:</span> {count}/{course.capacity}
                    {full && <span className="ml-1 text-warning-600 dark:text-warning-400">(Full)</span>}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  <button
                    onClick={() => openEnrollments(course)}
                    className="btn-ghost flex-1 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    <Users className="h-4 w-4" />
                    Enrollments
                  </button>
                  <button
                    onClick={() => openEdit(course)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Course' : 'Add New Course'}
        description={editing ? 'Update course information' : 'Fill in the course details below'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CourseField label="Course Code" required>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input-base"
                placeholder="CS101"
              />
            </CourseField>
            <CourseField label="Credits" required>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 1 })}
                className="input-base"
              />
            </CourseField>
            <CourseField label="Capacity">
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                className="input-base"
              />
            </CourseField>
          </div>

          <CourseField label="Course Title" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-base"
              placeholder="Introduction to Computer Science"
            />
          </CourseField>

          <CourseField label="Instructor">
            <input
              type="text"
              value={form.instructor ?? ''}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              className="input-base"
              placeholder="Dr. Jane Smith"
            />
          </CourseField>

          <CourseField label="Description">
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-base"
              rows={3}
              placeholder="A brief description of the course content..."
            />
          </CourseField>

          <CourseField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
              className="input-base"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </CourseField>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrollment modal */}
      <Modal
        open={!!enrollModalCourse}
        onClose={() => setEnrollModalCourse(null)}
        title={enrollModalCourse ? `${enrollModalCourse.code} - Enrollments` : ''}
        description={enrollModalCourse ? enrollModalCourse.title : ''}
        size="md"
      >
        <div className="space-y-4">
          {/* Enroll a student */}
          <div className="flex gap-2">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="input-base flex-1"
            >
              <option value="">Select a student to enroll...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} - {s.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleEnroll}
              disabled={!selectedStudent || enrollLoading}
              className="btn-primary whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Enroll
            </button>
          </div>

          {availableStudents.length === 0 && allStudents.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All active students are already enrolled in this course.
            </p>
          )}

          {/* Enrolled list */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enrolled Students ({enrollments.length})
            </p>
            {enrollments.length === 0 ? (
              <div className="py-6 text-center">
                <GraduationCap className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No students enrolled yet</p>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {enrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {enrollment.student.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnenroll(enrollment.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

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

function CourseField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-error-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
