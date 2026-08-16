import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';

const router = Router();

// GET all students
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const students = await db.collection('students').find({}).toArray();

    res.json({
      success: true,
      data: students.map((student) => ({
        id: student._id.toString(),
        ...student,
        _id: undefined,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single student
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const student = await db.collection('students').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      data: {
        id: student._id.toString(),
        ...student,
        _id: undefined,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE student
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { first_name, last_name, email, phone, date_of_birth, gender, address, enrollment_date, status } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const student = {
      first_name,
      last_name,
      email,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      gender: gender || 'other',
      address: address || null,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      status: status || 'active',
      user_id: 'demo-user', // In real app, get from auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection('students').insertOne(student);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...student,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE student
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const { first_name, last_name, email, phone, date_of_birth, gender, address, enrollment_date, status } = req.body;

    const updateData = {
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(date_of_birth !== undefined && { date_of_birth: date_of_birth || null }),
      ...(gender && { gender }),
      ...(address !== undefined && { address: address || null }),
      ...(enrollment_date && { enrollment_date }),
      ...(status && { status }),
      updated_at: new Date().toISOString(),
    };

    const result = await db.collection('students').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Student not found' });
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

// DELETE student
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDB();
    const result = await db.collection('students').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Also delete enrollments and attendance records
    await db.collection('enrollments').deleteMany({
      student_id: req.params.id,
    });
    await db.collection('attendance').deleteMany({
      student_id: req.params.id,
    });

    res.json({ success: true, message: 'Student deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
