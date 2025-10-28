import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const inMemoryNotifications = [];

router.post('/', authenticate(), (req, res) => {
  const { targetId, type, message, sendAt } = req.body;

  if (!targetId || !type || !message) {
    return res.status(400).json({ message: 'Missing notification fields' });
  }

  const notification = {
    id: `${Date.now()}`,
    targetId,
    type,
    message,
    sendAt: sendAt ? new Date(sendAt).toISOString() : new Date().toISOString(),
    createdBy: req.user.id,
  };

  inMemoryNotifications.push(notification);
  res.status(201).json(notification);
});

router.get('/', authenticate(), (req, res) => {
  const notifications = inMemoryNotifications.filter((item) => item.targetId === req.user.id);
  res.json(notifications);
});

export default router;
