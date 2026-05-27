import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all branches (public)
router.get('/', async (req, res) => {
  try {
    const branches = await db.all('SELECT * FROM branches ORDER BY name');
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get single branch (public)
router.get('/:id', async (req, res) => {
  try {
    const branch = await db.get('SELECT * FROM branches WHERE id = ?', [req.params.id]);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Create branch (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, phone, username, password } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'Name, address, and phone are required' });
    }

    // Check if branch name already exists
    const existing = await db.get('SELECT * FROM branches WHERE name = ?', [name]);
    if (existing) {
      return res.status(400).json({ error: 'Branch with this name already exists' });
    }

    // Create the branch
    const result = await db.run(
      'INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)',
      [name, address, phone]
    );

    const branchId = result.lastID;

    // If username and password are provided, create branch user account
    if (username && password) {
      // Check if username already exists
      const usernameExists = await db.get('SELECT * FROM branch_users WHERE username = ?', [username]);
      if (usernameExists) {
        // Rollback branch creation
        await db.run('DELETE FROM branches WHERE id = ?', [branchId]);
        return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
      }

      // Hash password and create branch user
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.run(
        'INSERT INTO branch_users (branchId, username, password) VALUES (?, ?, ?)',
        [branchId, username, hashedPassword]
      );
    }

    const newBranch = await db.get('SELECT * FROM branches WHERE id = ?', [branchId]);
    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update branch (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    // Check if branch exists
    const existing = await db.get('SELECT * FROM branches WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existing.name) {
      const nameExists = await db.get('SELECT * FROM branches WHERE name = ? AND id != ?', [name, req.params.id]);
      if (nameExists) {
        return res.status(400).json({ error: 'Branch with this name already exists' });
      }
    }

    await db.run(
      'UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ?',
      [name || existing.name, address || existing.address, phone || existing.phone, req.params.id]
    );

    const updatedBranch = await db.get('SELECT * FROM branches WHERE id = ?', [req.params.id]);
    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete branch (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const branch = await db.get('SELECT * FROM branches WHERE id = ?', [req.params.id]);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if branch has products
    const productCount = await db.get('SELECT COUNT(*) as count FROM products WHERE branchId = ?', [req.params.id]);
    if (productCount.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete branch. It has ${productCount.count} product(s) associated with it. Please delete or reassign products first.` 
      });
    }

    await db.run('DELETE FROM branches WHERE id = ?', [req.params.id]);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;


