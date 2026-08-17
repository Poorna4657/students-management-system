import { Db, ObjectId } from 'mongodb';

export async function seedDatabase(db: Db) {
  const studentCount = await db.collection('students').countDocuments();
  if (studentCount > 0) {
    return; // Already seeded
  }

  console.log('🌱 Database is empty. Seeding initial data...');

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 1. Seed Students
  const students = [
    {
      _id: new ObjectId(),
      first_name: 'Alex',
      last_name: 'Johnson',
      email: 'alex.j@example.com',
      phone: '+1 (555) 234-5678',
      date_of_birth: '2002-05-14',
      gender: 'male',
      address: '123 University Ave, Campus Town',
      enrollment_date: '2023-09-01',
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      first_name: 'Sophia',
      last_name: 'Martinez',
      email: 'sophia.m@example.com',
      phone: '+1 (555) 345-6789',
      date_of_birth: '2001-11-20',
      gender: 'female',
      address: '456 College Blvd, Westville',
      enrollment_date: '2023-09-01',
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      first_name: 'David',
      last_name: 'Chen',
      email: 'david.chen@example.com',
      phone: '+1 (555) 456-7890',
      date_of_birth: '2003-03-08',
      gender: 'male',
      address: '789 Tech Road, Silicon Heights',
      enrollment_date: '2024-01-15',
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      first_name: 'Emma',
      last_name: 'Wilson',
      email: 'emma.w@example.com',
      phone: '+1 (555) 567-8901',
      date_of_birth: '2002-08-30',
      gender: 'female',
      address: '321 Elm Street, Oak Ridge',
      enrollment_date: '2023-09-01',
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.b@example.com',
      phone: '+1 (555) 678-9012',
      date_of_birth: '2000-12-12',
      gender: 'male',
      address: '654 Pine Street, Metro City',
      enrollment_date: '2022-09-01',
      status: 'graduated',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
  ];

  await db.collection('students').insertMany(students);

  // 2. Seed Courses
  const courses = [
    {
      _id: new ObjectId(),
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamentals of programming, algorithms, and data structures.',
      credits: 4,
      instructor: 'Dr. Alan Turing',
      capacity: 35,
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      code: 'MATH201',
      title: 'Linear Algebra & Calculus',
      description: 'Matrix theory, vector spaces, and multivariable calculus.',
      credits: 3,
      instructor: 'Prof. Katherine Johnson',
      capacity: 40,
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      code: 'DB301',
      title: 'Database Management Systems',
      description: 'Relational & NoSQL databases, SQL, MongoDB, indexing, and normalization.',
      credits: 3,
      instructor: 'Dr. Edgar Codd',
      capacity: 30,
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
    {
      _id: new ObjectId(),
      code: 'WEB402',
      title: 'Full Stack Web Development',
      description: 'Modern web frameworks, React, Node.js, RESTful APIs, and cloud deployment.',
      credits: 4,
      instructor: 'Prof. Tim Berners-Lee',
      capacity: 25,
      status: 'active',
      user_id: 'demo-user',
      created_at: now,
      updated_at: now,
    },
  ];

  await db.collection('courses').insertMany(courses);

  // 3. Seed Enrollments
  const enrollments = [
    {
      _id: new ObjectId(),
      student_id: students[0]._id,
      course_id: courses[0]._id,
      enrollment_date: '2023-09-05',
      grade: 'A',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[0]._id,
      course_id: courses[2]._id,
      enrollment_date: '2023-09-05',
      grade: 'A-',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[1]._id,
      course_id: courses[0]._id,
      enrollment_date: '2023-09-06',
      grade: 'B+',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[1]._id,
      course_id: courses[3]._id,
      enrollment_date: '2023-09-06',
      grade: 'A',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[2]._id,
      course_id: courses[1]._id,
      enrollment_date: '2024-01-18',
      grade: 'B',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[3]._id,
      course_id: courses[2]._id,
      enrollment_date: '2023-09-07',
      grade: 'A',
      status: 'enrolled',
      user_id: 'demo-user',
      created_at: now,
    },
  ];

  await db.collection('enrollments').insertMany(enrollments);

  // 4. Seed Attendance Records
  const attendanceRecords = [
    {
      _id: new ObjectId(),
      student_id: students[0]._id,
      course_id: courses[0]._id,
      date: today,
      status: 'present',
      notes: 'On time',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[1]._id,
      course_id: courses[0]._id,
      date: today,
      status: 'present',
      notes: 'On time',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[2]._id,
      course_id: courses[1]._id,
      date: today,
      status: 'late',
      notes: 'Arrived 10 mins late due to traffic',
      user_id: 'demo-user',
      created_at: now,
    },
    {
      _id: new ObjectId(),
      student_id: students[3]._id,
      course_id: courses[2]._id,
      date: today,
      status: 'present',
      notes: 'On time',
      user_id: 'demo-user',
      created_at: now,
    },
  ];

  await db.collection('attendance').insertMany(attendanceRecords);

  console.log('✓ Database seeded with initial sample data successfully!');
}
