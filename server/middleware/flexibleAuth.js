import jwt from 'jsonwebtoken';

// Middleware that accepts both admin and branch tokens
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Store user info in request
    req.user = user;
    
    // Check if it's a branch user
    if (user.type === 'branch') {
      req.branchUser = user;
      req.isBranchUser = true;
    } else {
      req.isAdmin = true;
    }
    
    next();
  });
};




