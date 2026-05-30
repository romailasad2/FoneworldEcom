import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Flatten the branch relation into branchName/branchAddress and strip the password hash.
const presentBranchUser = (bu) => {
  if (!bu) return bu;
  const { password, branch, ...rest } = bu;
  return {
    ...rest,
    branchName: branch ? branch.name : null,
    branchAddress: branch ? branch.address : null
  };
};

// Get all branch users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const branchUsers = await db.branchUser.findMany({
      include: { branch: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(branchUsers.map(presentBranchUser));
  } catch (error) {
    console.error('Error fetching branch users:', error);
    res.status(500).json({ error: 'Failed to fetch branch users' });
  }
});

// Get branch users by branch ID (admin only) - MUST come before /:id route
router.get('/branch/:branchId', authenticateToken, async (req, res) => {
  try {
    const branchUsers = await db.branchUser.findMany({
      where: { branchId: parseInt(req.params.branchId) },
      include: { branch: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(branchUsers.map(presentBranchUser));
  } catch (error) {
    console.error('Error fetching branch users:', error);
    res.status(500).json({ error: 'Failed to fetch branch users' });
  }
});

// Get single branch user (admin only) - MUST come after /branch/:branchId
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const branchUser = await db.branchUser.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { branch: true }
    });

    if (!branchUser) {
      return res.status(404).json({ error: 'Branch user not found' });
    }

    res.json(presentBranchUser(branchUser));
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

    const parsedBranchId = parseInt(branchId);

    // Verify branch exists
    const branch = await db.branch.findUnique({ where: { id: parsedBranchId } });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if username already exists
    const existing = await db.branchUser.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await db.branchUser.create({
      data: { branchId: parsedBranchId, username, password: hashedPassword }
    });

    const newBranchUser = await db.branchUser.findUnique({
      where: { id: created.id },
      include: { branch: true }
    });

    res.status(201).json(presentBranchUser(newBranchUser));
  } catch (error) {
    console.error('Error creating branch user:', error);
    res.status(500).json({ error: 'Failed to create branch user' });
  }
});

// Update branch user (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, password, branchId } = req.body;
    const parsedBranchId = branchId !== undefined ? parseInt(branchId) : undefined;

    // Check if branch user exists
    const existing = await db.branchUser.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Branch user not found' });
    }

    // If branchId is being changed, verify new branch exists
    if (parsedBranchId !== undefined && parsedBranchId !== existing.branchId) {
      const branch = await db.branch.findUnique({ where: { id: parsedBranchId } });
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
    }

    // Check if username is being changed and if new username already exists
    if (username && username !== existing.username) {
      const usernameExists = await db.branchUser.findFirst({
        where: { username, NOT: { id } }
      });
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Prepare update data
    const data = {};
    if (username && username !== existing.username) {
      data.username = username;
    }
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    if (parsedBranchId !== undefined && parsedBranchId !== existing.branchId) {
      data.branchId = parsedBranchId;
    }

    if (Object.keys(data).length > 0) {
      await db.branchUser.update({ where: { id }, data });
    }

    const updatedBranchUser = await db.branchUser.findUnique({
      where: { id },
      include: { branch: true }
    });

    res.json(presentBranchUser(updatedBranchUser));
  } catch (error) {
    console.error('Error updating branch user:', error);
    res.status(500).json({ error: 'Failed to update branch user' });
  }
});

// Delete branch user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const branchUser = await db.branchUser.findUnique({ where: { id } });

    if (!branchUser) {
      return res.status(404).json({ error: 'Branch user not found' });
    }

    await db.branchUser.delete({ where: { id } });
    res.json({ message: 'Branch user deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch user:', error);
    res.status(500).json({ error: 'Failed to delete branch user' });
  }
});

export default router;
