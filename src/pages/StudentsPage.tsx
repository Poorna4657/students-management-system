import { useEffect, useState, useMemo, FormEvent } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/supabase';
import { Student, StudentStatus, Gender, StudentInput } from '@/types';
import { formatDate, getInitials, getFullName, getAge } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog, useConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { InlineLoader } from '@/components/Loader';
import { useToast } from '@/components/Toast';

const statusOptions: StudentStatus[] = ['active', 'inactive', 'graduated', 'suspended'];
const genderOptions: Gender[] = ['male', 'female', 'other'];

const emptyForm: StudentInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'other',
  address: '',
  enrollment_date: new Date().toISOString().split('T')[0],
  status: 'active',
};

export function StudentsPage() {
  const { notify } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirmDialog();

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.students.list();
      setStudents((data ?? []) as Student[]);
    } catch (error: any) {
      notify('error', error.message || 'Failed to load students');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !search ||
        getFullName(s.first_name, s.last_name).toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone ?? '',
      date_of_birth: student.date_of_birth ?? '',
      gender: student.gender ?? 'other',
      address: student.address ?? '',
      enrollment_date: student.enrollment_date,
      status: student.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = {
      ...form,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      address: form.address || null,
    };

    try {
      if (editing) {
        await api.students.update(editing.id, payload);
        notify('success', 'Student updated successfully');
      } else {
        await api.students.create(payload);
        notify('success', 'Student added successfully');
      }
      setModalOpen(false);
      loadStudents();
    } catch (error: any) {
      notify('error', error.message || 'Failed to save student');
    }
    setSaving(false);
  };

  const handleDelete = (student: Student) => {
    confirm({
      title: 'Delete Student',
      message: `Are you sure you want to delete ${getFullName(student.first_name, student.last_name)}? This will also remove all their enrollments and attendance records.`,
      onConfirm: async () => {
        try {
          await api.students.delete(student.id);
          notify('success', 'Student deleted');
          loadStudents();
        } catch (error: any) {
          notify('error', error.message || 'Failed to delete student');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {students.length} total · {filtered.length} shown
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* Search & filter */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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

      {/* Students list */}
      {loading ? (
        <InlineLoader text="Loading students..." />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={search || statusFilter !== 'all' ? 'No matching students' : 'No students yet'}
            description={
              search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Click "Add Student" to create your first student record.'
            }
            action={
              !search && statusFilter === 'all' ? (
                <button onClick={openAdd} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add Student
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Student
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contact
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Enrolled
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filtered.map((student) => (
                  <tr key={student.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {getFullName(student.first_name, student.last_name)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getAge(student.date_of_birth)} · {student.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{student.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{student.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(student.enrollment_date)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={student.status} type="student" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-primary-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/20 dark:hover:text-error-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((student) => (
              <div key={student.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {getInitials(student.first_name, student.last_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getFullName(student.first_name, student.last_name)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getAge(student.date_of_birth)}</p>
                    </div>
                  </div>
                  <StatusBadge status={student.status} type="student" />
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {student.email}
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {student.phone}
                    </div>
                  )}
                  <p className="text-xs">Enrolled: {formatDate(student.enrollment_date)}</p>
                </div>
                <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  <button onClick={() => openEdit(student)} className="btn-ghost flex-1">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(student)} className="btn-ghost flex-1 text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Student' : 'Add New Student'}
        description={editing ? 'Update student information' : 'Fill in the student details below'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="input-base"
                placeholder="John"
              />
            </Field>
            <Field label="Last Name" required>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="input-base"
                placeholder="Doe"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-base"
                placeholder="john.doe@school.edu"
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-base"
                placeholder="+1 234 567 890"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Date of Birth">
              <input
                type="date"
                value={form.date_of_birth ?? ''}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="input-base"
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender ?? 'other'}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                className="input-base"
              >
                {genderOptions.map((g) => (
                  <option key={g} value={g} className="capitalize">
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Enrollment Date" required>
              <input
                type="date"
                required
                value={form.enrollment_date}
                onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Address">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={form.address ?? ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-base pl-10"
                rows={2}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
              className="input-base"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
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

function Field({
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
