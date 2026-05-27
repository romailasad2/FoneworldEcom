import jwt from 'jsonwebtoken';

export const authenticateBranchToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if token is for a branch user
    if (user.type !== 'branch') {
      return res.status(403).json({ error: 'Invalid token type. Branch access required.' });
    }
    
    req.branchUser = user;
    next();
  });
};




