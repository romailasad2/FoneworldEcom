import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();

// Branch login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find branch user in database
    const branchUser = await db.branchUser.findUnique({
      where: { username },
      include: { branch: true }
    });

    if (!branchUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, branchUser.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const branchName = branchUser.branch ? branchUser.branch.name : null;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: branchUser.id,
        username: branchUser.username,
        branchId: branchUser.branchId,
        type: 'branch'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: branchUser.id,
        username: branchUser.username,
        branchId: branchUser.branchId,
        branchName
      }
    });
  } catch (error) {
    console.error('Branch login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify branch token route
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Check if token is for a branch user
      if (decoded.type !== 'branch') {
        return res.status(403).json({ error: 'Invalid token type' });
      }

      res.json({ valid: true, user: decoded });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
