export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';
export type Gender = 'male' | 'female' | 'other';
export type CourseStatus = 'active' | 'archived';
export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  enrollment_date: string;
  status: StudentStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  instructor: string | null;
  capacity: number;
  status: CourseStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  grade: string | null;
  status: EnrollmentStatus;
  user_id: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  course_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  user_id: string;
  created_at: string;
}

export interface EnrollmentWithRelations extends Enrollment {
  student: Pick<Student, 'id' | 'first_name' | 'last_name' | 'email'>;
  course: Pick<Course, 'id' | 'code' | 'title'>;
}

export interface AttendanceWithRelations extends Attendance {
  student: Pick<Student, 'id' | 'first_name' | 'last_name'>;
  course: Pick<Course, 'id' | 'code' | 'title'>;
}

export type StudentInput = Omit<Student, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CourseInput = Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type EnrollmentInput = Omit<Enrollment, 'id' | 'user_id' | 'created_at'>;
export type AttendanceInput = Omit<Attendance, 'id' | 'user_id' | 'created_at'>;
