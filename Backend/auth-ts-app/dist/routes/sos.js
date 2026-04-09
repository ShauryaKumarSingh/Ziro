"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Alert_1 = __importDefault(require("../models/Alert"));
const User_1 = __importDefault(require("../models/User"));
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
// ENDPOINT 1: Triggers the SOS Alert
// POST /api/sos/trigger
router.post('/trigger', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.sosSchema), async (req, res) => {
    const { latitude, longitude } = req.body;
    const userId = req.user?.id;
    if (!latitude || !longitude) {
        return res.status(400).json({ msg: 'Location data is required.' });
    }
    try {
        const user = await User_1.default.findById(userId);
        if (!user || !user.touristId) {
            return res.status(404).json({ msg: 'User or Tourist ID not found.' });
        }
        const newAlert = new Alert_1.default({
            userId,
            touristId: user.touristId,
            location: { latitude, longitude },
        });
        await newAlert.save();
        res.status(201).json({ msg: 'SOS alert triggered and recorded.', alert: newAlert });
    }
    catch (err) {
        res.status(500).json({ error: "Server error during SOS trigger." });
    }
});
// ENDPOINT 2: The "Police Dashboard" - Gets all active alerts
// GET /api/sos/active
router.get('/active', auth_1.authMiddleware, async (req, res) => {
    try {
        const activeAlerts = await Alert_1.default.find({ status: 'active' })
            .populate('userId', 'username email') // Get user's name and email
            .sort({ createdAt: -1 }); // Show newest alerts first
        res.status(200).json(activeAlerts);
    }
    catch (err) {
        console.error("🔥 Get Alerts Error:", err);
        res.status(500).json({ error: "Server error fetching active alerts." });
    }
});
router.post('/trigger', auth_1.authMiddleware, async (req, res) => {
    const { latitude, longitude } = req.body;
    const userId = req.user?.id;
    try {
        const user = await User_1.default.findById(userId);
        // ...
        const newAlert = new Alert_1.default({ /* ... */});
        await newAlert.save();
        // ✅ NEW: Broadcast the new alert to all dashboards
        req.io.to('dashboard-room').emit('new-alert', newAlert);
        res.status(201).json({ msg: 'SOS alert triggered and recorded.', alert: newAlert });
    }
    catch (err) {
        // ...
    }
});
exports.default = router;
