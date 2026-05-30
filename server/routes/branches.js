import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all branches (public)
router.get('/', async (req, res) => {
  try {
    const branches = await db.branch.findMany({ orderBy: { name: 'asc' } });
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get single branch (public)
router.get('/:id', async (req, res) => {
  try {
    const branch = await db.branch.findUnique({ where: { id: parseInt(req.params.id) } });

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
    const existing = await db.branch.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Branch with this name already exists' });
    }

    // If creating a branch user too, ensure the username is free first
    if (username && password) {
      const usernameExists = await db.branchUser.findUnique({ where: { username } });
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
      }
    }

    // Create the branch (and optionally a branch user) atomically
    const newBranch = await db.$transaction(async (tx) => {
      const branch = await tx.branch.create({ data: { name, address, phone } });

      if (username && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await tx.branchUser.create({
          data: { branchId: branch.id, username, password: hashedPassword }
        });
      }

      return branch;
    });

    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update branch (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const branchId = parseInt(req.params.id);
    const { name, address, phone } = req.body;

    // Check if branch exists
    const existing = await db.branch.findUnique({ where: { id: branchId } });
    if (!existing) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existing.name) {
      const nameExists = await db.branch.findFirst({
        where: { name, NOT: { id: branchId } }
      });
      if (nameExists) {
        return res.status(400).json({ error: 'Branch with this name already exists' });
      }
    }

    const updatedBranch = await db.branch.update({
      where: { id: branchId },
      data: {
        name: name || existing.name,
        address: address || existing.address,
        phone: phone || existing.phone
      }
    });

    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete branch (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const branchId = parseInt(req.params.id);
    const branch = await db.branch.findUnique({ where: { id: branchId } });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if branch has products
    const productCount = await db.product.count({ where: { branchId } });
    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete branch. It has ${productCount} product(s) associated with it. Please delete or reassign products first.`
      });
    }

    await db.branch.delete({ where: { id: branchId } });
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;
