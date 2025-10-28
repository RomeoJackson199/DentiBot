import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-secret';

export const authenticate = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const decoded = jwt.verify(token, secret);
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'You are not allowed to perform this action' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.error('JWT verification failed', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

export const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId || null,
      name: user.name,
    },
    secret,
    { expiresIn: '7d' }
  );
};
