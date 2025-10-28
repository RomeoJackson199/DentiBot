import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prismaClient.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role, businessName, category } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!['client', 'professional'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'professional') {
      if (!businessName || !category) {
        return res.status(400).json({ message: 'Professionals must provide a business name and category' });
      }

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      const business = await prisma.business.create({
        data: {
          name: businessName,
          category,
          ownerId: user.id,
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { businessId: business.id },
      });

      const token = signToken({ ...updatedUser, businessId: business.id });

      return res.status(201).json({
        token,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          businessId: business.id,
        },
        business,
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true, ownedBusiness: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId || user.ownedBusiness?.id || null,
        profileImg: user.profileImg,
      },
      business: user.business || user.ownedBusiness || null,
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

export default router;
