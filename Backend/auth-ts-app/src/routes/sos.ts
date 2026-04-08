import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import Alert from '../models/Alert';
import User from '../models/User';

const router = Router();

// ENDPOINT 1: Triggers the SOS Alert
// POST /api/sos/trigger
router.post('/trigger', authMiddleware, async (req: AuthRequest, res: Response) => {
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
    res.status(201).json({ msg: 'SOS alert triggered and recorded.', alert: newAlert });
  } catch (err: any) {
    res.status(500).json({ error: "Server error during SOS trigger." });
  }
});


// ENDPOINT 2: The "Police Dashboard" - Gets all active alerts
// GET /api/sos/active

router.get('/active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const activeAlerts = await Alert.find({ status: 'active' })
      .populate('userId', 'username email') // Get user's name and email
      .sort({ createdAt: -1 }); // Show newest alerts first

    res.status(200).json(activeAlerts);
  } catch (err: any) {
    console.error("🔥 Get Alerts Error:", err);
    res.status(500).json({ error: "Server error fetching active alerts." });
  }
});
router.post('/trigger', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = req.user?.id; 

  try {
    const user = await User.findById(userId);
    // ...
    const newAlert = new Alert({ /* ... */ });
    await newAlert.save();

    // ✅ NEW: Broadcast the new alert to all dashboards
    req.io.to('dashboard-room').emit('new-alert', newAlert);

    res.status(201).json({ msg: 'SOS alert triggered and recorded.', alert: newAlert });
  } catch (err) {
    // ...
  }
});
export default router;