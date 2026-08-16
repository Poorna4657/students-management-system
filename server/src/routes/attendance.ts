import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';

const router = Router();

// GET all attendance records
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const attendance = await db
      .collection('attendance')
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
        {
          $sort: { date: -1 },
        },
      ])
      .toArray();

    res.json({
      success: true,
      data: attendance.map((record) => ({
        id: record._id.toString(),
        student_id: record.student_id.toString(),
        course_id: record.course_id.toString(),
        date: record.date,
        status: record.status,
        notes: record.notes,
        student: {
          id: record.student._id.toString(),
          first_name: record.student.first_name,
          last_name: record.student.last_name,
        },
        course: {
          id: record.course._id.toString(),
          code: record.course.code,
          title: record.course.title,
        },
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET attendance by course and date
router.get('/course/:courseId/date/:date', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { courseId, date } = req.params;

    const attendance = await db
      .collection('attendance')
      .find({
        course_id: new ObjectId(courseId),
        date: date,
      })
      .toArray();

    res.json({
      success: true,
      data: attendance.map((record) => ({
        id: record._id.toString(),
        student_id: record.student_id.toString(),
        course_id: record.course_id.toString(),
        date: record.date,
        status: record.status,
        notes: record.notes,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE or UPDATE attendance
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { student_id, course_id, date, status, notes } = req.body;

    if (!student_id || !course_id || !date || !status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const studentObjId = new ObjectId(student_id);
    const courseObjId = new ObjectId(course_id);

    // Try to find existing record
    const existing = await db.collection('attendance').findOne({
      student_id: studentObjId,
      course_id: courseObjId,
      date: date,
    });

    if (existing) {
      // Update existing
      const result = await db.collection('attendance').findOneAndUpdate(
        {
          student_id: studentObjId,
          course_id: courseObjId,
          date: date,
        },
        {
          $set: {
            status,
            notes: notes || null,
          },
        },
        { returnDocument: 'after' }
      );
 
      if (!result || !result.value) {
        return res.status(404).json({ success: false, message: 'Attendance record not found' });
      }

      const updated = result.value!;
      return res.json({
        success: true,
        data: {
          id: updated._id.toString(),
          student_id: updated.student_id.toString(),
          course_id: updated.course_id.toString(),
          date: updated.date,
          status: updated.status,
          notes: updated.notes,
        },
      });
    }

    // Create new
    const attendance = {
      student_id: studentObjId,
      course_id: courseObjId,
      date,
      status,
      notes: notes || null,
      user_id: 'demo-user',
      created_at: new Date().toISOString(),
    };

    const result = await db.collection('attendance').insertOne(attendance);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        student_id: studentObjId.toString(),
        course_id: courseObjId.toString(),
        date,
        status,
        notes: notes || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE attendance
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const result = await db.collection('attendance').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
