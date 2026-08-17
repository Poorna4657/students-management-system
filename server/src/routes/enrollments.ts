import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';

const router = Router();

// GET all enrollments
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const enrollments = await db
      .collection('enrollments')
      .aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'student_id',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $lookup: {
            from: 'courses',
            localField: 'course_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $unwind: '$student',
        },
        {
          $unwind: '$course',
        },
      ])
      .toArray();

    res.json({
      success: true,
      data: enrollments.map((enrollment) => ({
        id: enrollment._id.toString(),
        student_id: enrollment.student_id,
        course_id: enrollment.course_id,
        enrollment_date: enrollment.enrollment_date,
        grade: enrollment.grade,
        status: enrollment.status,
        student: {
          id: enrollment.student._id.toString(),
          first_name: enrollment.student.first_name,
          last_name: enrollment.student.last_name,
          email: enrollment.student.email,
        },
        course: {
          id: enrollment.course._id.toString(),
          code: enrollment.course.code,
          title: enrollment.course.title,
        },
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET enrollments by course
router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const enrollments = await db
      .collection('enrollments')
      .aggregate([
        {
          $match: {
            course_id: ObjectId.isValid(req.params.courseId)
              ? new ObjectId(req.params.courseId)
              : req.params.courseId,
          },
        },
        {
          $lookup: {
            from: 'students',
            localField: 'student_id',
            foreignField: '_id',
            as: 'student',
          },
        },
        {
          $unwind: '$student',
        },
      ])
      .toArray();

    res.json({
      success: true,
      data: enrollments.map((enrollment) => ({
        id: enrollment._id.toString(),
        student_id: enrollment.student_id.toString(),
        course_id: enrollment.course_id.toString(),
        enrollment_date: enrollment.enrollment_date,
        grade: enrollment.grade,
        status: enrollment.status,
        student: {
          id: enrollment.student._id.toString(),
          first_name: enrollment.student.first_name,
          last_name: enrollment.student.last_name,
          email: enrollment.student.email,
        },
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE enrollment
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { student_id, course_id, enrollment_date, status } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Convert string IDs to ObjectId
    const studentObjId = new ObjectId(student_id);
    const courseObjId = new ObjectId(course_id);

    const enrollment = {
      student_id: studentObjId,
      course_id: courseObjId,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      grade: null,
      status: status || 'enrolled',
      user_id: 'demo-user',
      created_at: new Date().toISOString(),
    };

    const result = await db.collection('enrollments').insertOne(enrollment);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...enrollment,
        student_id: enrollment.student_id.toString(),
        course_id: enrollment.course_id.toString(),
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student already enrolled in this course' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE enrollment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { grade, status } = req.body;

    const updateData = {
      ...(grade !== undefined && { grade: grade || null }),
      ...(status && { status }),
    };

    const result = await db.collection('enrollments').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const updated: any = (result && 'value' in result) ? result.value : result;

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({
      success: true,
      data: {
        id: updated._id.toString(),
        ...updated,
        student_id: updated.student_id.toString(),
        course_id: updated.course_id.toString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE enrollment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const result = await db.collection('enrollments').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({ success: true, message: 'Enrollment deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
