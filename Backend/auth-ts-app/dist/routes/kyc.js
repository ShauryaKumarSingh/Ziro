"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Kyc_1 = __importDefault(require("../models/Kyc"));
const User_1 = __importDefault(require("../models/User"));
const nanoid_1 = require("nanoid"); // 💡 Import nanoid
const router = (0, express_1.Router)();
router.post("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        // 💡 1. Check if KYC already exists for this user
        const existingKYC = await Kyc_1.default.findOne({ userId });
        if (existingKYC) {
            return res.status(400).json({ msg: "KYC details have already been submitted." });
        }
        const { aadhaar, dob, gender, phone, email, emergency_contact, trip_itinerary } = req.body;
        // For a hackathon MVP, auto-verifying is fine.
        // In a real app, this would be `verified: false` until an admin approves it.
        const kycData = await Kyc_1.default.create({
            userId,
            aadhaar,
            dob,
            gender,
            phone,
            email,
            emergency_contact,
            trip_itinerary,
            verified: true,
        });
        // 💡 2. Generate a more robust, unique Tourist ID
        const touristId = `TID-${(0, nanoid_1.nanoid)(8)}`; // Example: TID-vchz78y4
        // 💡 3. Update the user record
        await User_1.default.findByIdAndUpdate(userId, {
            touristId,
            kycStatus: "approved",
        });
        res.status(201).json({ msg: "KYC submitted successfully", touristId, kycData });
    }
    catch (err) {
        console.error("🔥 KYC Error:", err);
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
