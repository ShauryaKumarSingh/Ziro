// routes/tourist.ts
import { Router, Request, Response } from "express";
import User from "../models/User";
import KYC from "../models/Kyc";
import QRCode from "qrcode";

const router = Router();

router.get("/:touristId", async (req: Request, res: Response) => {
  try {
    const { touristId } = req.params;

    // find user
    const user = await User.findOne({ touristId }).select("username touristId kycStatus");
    if (!user) return res.status(404).json({ msg: "Tourist not found" });

    // fetch KYC
    const kycData = await KYC.findOne({ userId: user._id }).select(
      "trip_itinerary emergency_contact phone gender"
    );

    // data to be embedded in QR
    const qrPayload = {
      touristId: user.touristId,
      username: user.username,
      kycStatus: user.kycStatus,
    };

    // generate QR code (base64 image)
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrPayload));

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
