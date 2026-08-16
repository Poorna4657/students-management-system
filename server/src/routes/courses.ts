import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';

const router = Router();

// GET all courses
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const courses = await db.collection('courses').find({}).toArray();

    res.json({
      success: true,
      data: courses.map((course) => ({
        id: course._id.toString(),
        ...course,
        _id: undefined,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single course
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const course = await db.collection('courses').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      data: {
        id: course._id.toString(),
        ...course,
        _id: undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE course
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { code, title, description, credits, instructor, capacity, status } = req.body;

    // Validate required fields
    if (!code || !title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const course = {
      code,
      title,
      description: description || null,
      credits: credits || 3,
      instructor: instructor || null,
      capacity: capacity || 30,
      status: status || 'active',
      user_id: 'demo-user', // In real app, get from auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection('courses').insertOne(course);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...course,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE course
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { code, title, description, credits, instructor, capacity, status } = req.body;

    const updateData = {
      ...(code && { code }),
      ...(title && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(credits !== undefined && { credits }),
      ...(instructor !== undefined && { instructor: instructor || null }),
      ...(capacity !== undefined && { capacity }),
      ...(status && { status }),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection('courses').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      data: {
        id: result.value._id.toString(),
        ...result.value,
        _id: undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE course
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const result = await db.collection('courses').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Also delete enrollments and attendance records
    await db.collection('enrollments').deleteMany({
      course_id: req.params.id,
    });
    await db.collection('attendance').deleteMany({
      course_id: req.params.id,
    });

    res.json({ success: true, message: 'Course deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
