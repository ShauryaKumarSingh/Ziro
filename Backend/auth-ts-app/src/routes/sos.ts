import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import Alert from '../models/Alert';
import User from '../models/User';
import { validate, sosSchema } from '../middlewares/validation';

const router = Router();

// ENDPOINT 1: Triggers the SOS Alert
// POST /api/sos/trigger
router.post('/trigger', authMiddleware, validate(sosSchema), async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = req.user?.id;

  if (!latitude || !longitude) {
    return res.status(400).json({ msg: 'Location data is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.touristId) {
      return res.status(404).json({ msg: 'User or Tourist ID not found.' });
    }

    const newAlert = new Alert({
      userId,
      touristId: user.touristId,
      location: { latitude, longitude },
    });

    await newAlert.save();
    req.io?.to('dashboard-room').emit('new-alert', newAlert);

    res.status(201).json({ msg: 'SOS alert triggered and recorded.', alert: newAlert });
  } catch (err: any) {
    console.error('🔥 SOS Trigger Error:', err);
    res.status(500).json({ error: 'Server error during SOS trigger.' });
  }
});

// ENDPOINT 2: The "Police Dashboard" - Gets all active alerts
// GET /api/sos/active
router.get('/active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const activeAlerts = await Alert.find({ status: 'active' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(activeAlerts);
  } catch (err: any) {
    console.error('🔥 Get Alerts Error:', err);
    res.status(500).json({ error: 'Server error fetching active alerts.' });
  }
});

// ENDPOINT 3: Stop an active SOS
// PATCH /api/sos/stop/:sosId
router.patch('/stop/:sosId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { sosId } = req.params;
  const userId = req.user?.id;

  if (!sosId) {
    return res.status(400).json({ msg: 'SOS ID is required.' });
  }

  try {
    const alert = await Alert.findOne({ _id: sosId, userId, status: 'active' });
    if (!alert) {
      return res.status(404).json({ msg: 'Active SOS alert not found.' });
    }

    alert.status = 'resolved';
    await alert.save();

    req.io?.to('dashboard-room').emit('stop-sos', { touristId: alert.touristId, sosId: alert._id });

    res.status(200).json({ msg: 'SOS stopped and resolved.', alert });
  } catch (err: any) {
    console.error('🔥 Stop SOS Error:', err);
    res.status(500).json({ error: 'Server error stopping SOS.' });
  }
});

export default router;