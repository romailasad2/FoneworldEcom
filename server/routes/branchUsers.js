import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all branch users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const branchUsers = await db.all(`
      SELECT bu.*, b.name as branchName, b.address as branchAddress
      FROM branch_users bu
      LEFT JOIN branches b ON bu.branchId = b.id
      ORDER BY bu.createdAt DESC
    `);
    res.json(branchUsers);
  } catch (error) {
    console.error('Error fetching branch users:', error);
    res.status(500).json({ error: 'Failed to fetch branch users' });
  }
});

// Get branch users by branch ID (admin only) - MUST come before /:id route
router.get('/branch/:branchId', authenticateToken, async (req, res) => {
  try {
    const branchUsers = await db.all(
      'SELECT * FROM branch_users WHERE branchId = ? ORDER BY createdAt DESC',
      [req.params.branchId]
    );
    res.json(branchUsers);
  } catch (error) {
    console.error('Error fetching branch users:', error);
    res.status(500).json({ error: 'Failed to fetch branch users' });
  }
});

// Get single branch user (admin only) - MUST come after /branch/:branchId
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const branchUser = await db.get(`
      SELECT bu.*, b.name as branchName
      FROM branch_users bu
      LEFT JOIN branches b ON bu.branchId = b.id
      WHERE bu.id = ?
    `, [req.params.id]);
    
    if (!branchUser) {
      return res.status(404).json({ error: 'Branch user not found' });
    }
    
    // Don't send password hash
    delete branchUser.password;
    res.json(branchUser);
  } catch (error) {
    console.error('Error fetching branch user:', error);
    res.status(500).json({ error: 'Failed to fetch branch user' });
  }
});

// Create branch user (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { branchId, username, password } = req.body;

    if (!branchId || !username || !password) {
      return res.status(400).json({ error: 'Branch ID, username, and password are required' });
    }

    // Verify branch exists
    const branch = await db.get('SELECT * FROM branches WHERE id = ?', [branchId]);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if username already exists
    const existing = await db.get('SELECT * FROM branch_users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO branch_users (branchId, username, password) VALUES (?, ?, ?)',
      [branchId, username, hashedPassword]
    );

    const newBranchUser = await db.get(`
      SELECT bu.*, b.name as branchName
      FROM branch_users bu
      LEFT JOIN branches b ON bu.branchId = b.id
      WHERE bu.id = ?
    `, [result.lastID]);

    // Don't send password hash
    delete newBranchUser.password;
    res.status(201).json(newBranchUser);
  } catch (error) {
    console.error('Error creating branch user:', error);
    res.status(500).json({ error: 'Failed to create branch user' });
  }
});

// Update branch user (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { username, password, branchId } = req.body;

    // Check if branch user exists
    const existing = await db.get('SELECT * FROM branch_users WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Branch user not found' });
    }

    // If branchId is being changed, verify new branch exists
    if (branchId && branchId !== existing.branchId) {
      const branch = await db.get('SELECT * FROM branches WHERE id = ?', [branchId]);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
    }

    // Check if username is being changed and if new username already exists
    if (username && username !== existing.username) {
      const usernameExists = await db.get('SELECT * FROM branch_users WHERE username = ? AND id != ?', [username, req.params.id]);
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Prepare update fields
    let updateFields = [];
    let updateValues = [];

    if (username && username !== existing.username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    if (branchId && branchId !== existing.branchId) {
      updateFields.push('branchId = ?');
      updateValues.push(branchId);
    }

    if (updateFields.length === 0) {
      // No changes to make
      const branchUser = await db.get(`
        SELECT bu.*, b.name as branchName
        FROM branch_users bu
        LEFT JOIN branches b ON bu.branchId = b.id
        WHERE bu.id = ?
      `, [req.params.id]);
      delete branchUser.password;
      return res.json(branchUser);
    }

    updateValues.push(req.params.id);
    const updateQuery = `UPDATE branch_users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await db.run(updateQuery, updateValues);

    const updatedBranchUser = await db.get(`
      SELECT bu.*, b.name as branchName
      FROM branch_users bu
      LEFT JOIN branches b ON bu.branchId = b.id
      WHERE bu.id = ?
    `, [req.params.id]);

    // Don't send password hash
    delete updatedBranchUser.password;
    res.json(updatedBranchUser);
  } catch (error) {
    console.error('Error updating branch user:', error);
    res.status(500).json({ error: 'Failed to update branch user' });
  }
});

// Delete branch user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const branchUser = await db.get('SELECT * FROM branch_users WHERE id = ?', [req.params.id]);
    
    if (!branchUser) {
      return res.status(404).json({ error: 'Branch user not found' });
    }

    await db.run('DELETE FROM branch_users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Branch user deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch user:', error);
    res.status(500).json({ error: 'Failed to delete branch user' });
  }
});

export default router;

