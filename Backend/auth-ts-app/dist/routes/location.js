"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Alert_1 = __importDefault(require("../models/Alert"));
const router = (0, express_1.Router)();
// ===================================================================
// STEP 1: DEFINE YOUR DANGER ZONES
// You can add real places in Delhi for your demo.
// radius is in meters.
// ===================================================================
const DANGER_ZONES = [
    {
        name: 'Restricted Area Near Embassy',
        lat: 28.5983,
        lon: 77.1828,
        radius: 500
    },
    {
        name: 'Unsafe Zone After Dark',
        lat: 28.6328,
        lon: 77.2196,
        radius: 1000
    },
];
// ===================================================================
// STEP 2: DISTANCE CALCULATION LOGIC
// This is a standard formula to calculate distance between two GPS points.
// You can just copy and use it.
// ===================================================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in metres
}
// ===================================================================
// STEP 3: THE API ENDPOINT
// This receives a location and checks it against all danger zones.
// Endpoint: POST /api/location/check
// ===================================================================
router.post('/check', auth_1.authMiddleware, (req, res) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ msg: 'Latitude and longitude are required.' });
    }
    for (const zone of DANGER_ZONES) {
        const distance = getDistance(latitude, longitude, zone.lat, zone.lon);
        if (distance < zone.radius) {
            // If the user is closer than the radius, they are inside the zone.
            return res.status(200).json({
                inDangerZone: true,
                zoneName: zone.name,
                message: `ALERT: You have entered a high-risk area: ${zone.name}.`
            });
        }
    }
    // If the loop finishes, the user is not in any danger zone.
    res.status(200).json({ inDangerZone: false });
});
// (Inside src/routes/location.ts)
// ... existing /check route ...
// Endpoint: POST /api/location/update
// Receives continuous location updates during an active SOS
router.post('/update', auth_1.authMiddleware, async (req, res) => {
    const { latitude, longitude } = req.body;
    const userId = req.user?.id;
    try {
        // ✅ RENAMED 'alert' to 'alertToUpdate' to avoid conflict
        const alertToUpdate = await Alert_1.default.findOne({ userId, status: 'active' });
        if (alertToUpdate) {
            alertToUpdate.location = { latitude, longitude };
            await alertToUpdate.save();
            // Broadcast the location update to the dashboard
            req.io.to('dashboard-room').emit('location-update', {
                touristId: alertToUpdate.touristId,
                location: alertToUpdate.location
            });
            return res.status(200).json({ msg: 'Location updated.' });
        }
        res.status(404).json({ msg: 'No active alert found for this user.' });
    }
    catch (err) {
        res.status(500).json({ error: "Server error during location update." });
    }
});
// ... export default router
exports.default = router;
