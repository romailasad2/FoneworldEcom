import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user in database
    const user = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token route
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
      res.json({ valid: true, user: decoded });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current admin user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.get('SELECT id, username, createdAt FROM admin_users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get password info (for development/testing - shows if default password is still set)
router.get('/password-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.get('SELECT * FROM admin_users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if password is the default password (admin123)
    const defaultPassword = 'admin123';
    const isDefaultPassword = await bcrypt.compare(defaultPassword, user.password);
    
    res.json({
      isDefault: isDefaultPassword,
      defaultPassword: isDefaultPassword ? defaultPassword : null,
      message: isDefaultPassword 
        ? 'Using default password: admin123' 
        : 'Password has been changed from default'
    });
  } catch (error) {
    console.error('Get password info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin credentials
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newUsername, newPassword } = req.body;

    // Get current user from database
    const user = await db.get('SELECT * FROM admin_users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password if password is being changed
    if (newPassword || newUsername) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to update credentials' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Update username if provided
    if (newUsername && newUsername !== user.username) {
      // Check if new username already exists
      const existingUser = await db.get('SELECT * FROM admin_users WHERE username = ? AND id != ?', [newUsername, userId]);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      await db.run('UPDATE admin_users SET username = ? WHERE id = ?', [newUsername, userId]);
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.run('UPDATE admin_users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }

    // Get updated user info
    const updatedUser = await db.get('SELECT id, username, createdAt FROM admin_users WHERE id = ?', [userId]);
    
    // Generate new token if username changed
    let newToken = null;
    if (newUsername && newUsername !== user.username) {
      newToken = jwt.sign(
        { id: updatedUser.id, username: updatedUser.username },
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
        { expiresIn: '24h' }
      );
    }

    res.json({
      user: updatedUser,
      token: newToken, // Only returned if username changed
      message: 'Credentials updated successfully'
    });
  } catch (error) {
    console.error('Update admin credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


