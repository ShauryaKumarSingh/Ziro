"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/tourist.ts
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const Kyc_1 = __importDefault(require("../models/Kyc"));
const qrcode_1 = __importDefault(require("qrcode"));
const router = (0, express_1.Router)();
router.get("/:touristId", async (req, res) => {
    try {
        const { touristId } = req.params;
        // find user
        const user = await User_1.default.findOne({ touristId }).select("username touristId kycStatus");
        if (!user)
            return res.status(404).json({ msg: "Tourist not found" });
        // fetch KYC
        const kycData = await Kyc_1.default.findOne({ userId: user._id }).select("trip_itinerary emergency_contact phone gender");
        // data to be embedded in QR
        const qrPayload = {
            touristId: user.touristId,
            username: user.username,
            kycStatus: user.kycStatus,
        };
        // generate QR code (base64 image)
        const qrCode = await qrcode_1.default.toDataURL(JSON.stringify(qrPayload));
        res.json({
            touristId: user.touristId,
            username: user.username,
            kycStatus: user.kycStatus,
            tripItinerary: kycData?.trip_itinerary || null,
            emergencyContact: kycData?.emergency_contact || null,
            phone: kycData?.phone || null,
            gender: kycData?.gender || null,
            qrCode, // base64 string
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
