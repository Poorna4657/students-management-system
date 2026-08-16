import { Router, Request, Response } from 'express';
import { getDB } from '../config/mongodb.js';

const router = Router();

// Simple auth - just for demo
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // In a real app, verify password and create JWT token
    // For now, just return a demo response
    res.json({
      success: true,
      data: {
        id: 'demo-user',
        email: email,
        token: 'demo-token-' + Date.now(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // In a real app, hash password and create user
    res.status(201).json({
      success: true,
      data: {
        id: 'demo-user',
        email: email,
        name: name || '',
        token: 'demo-token-' + Date.now(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
});

export default router;
