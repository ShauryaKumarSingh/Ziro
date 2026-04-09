import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import KYC from "../models/Kyc";
import User from "../models/User";
import { nanoid } from "nanoid"; // 💡 Import nanoid
import { validate, kycSchema } from "../middlewares/validation";

const router = Router();

router.post("/", authMiddleware, validate(kycSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // 💡 1. Check if KYC already exists for this user
    const existingKYC = await KYC.findOne({ userId });
    if (existingKYC) {
      return res.status(400).json({ msg: "KYC details have already been submitted." });
    }

    const { aadhaar, dob, gender, phone, email, emergency_contact, trip_itinerary } = req.body;

    // For production security, KYC requires manual admin verification
    // In a real app, an admin would review and approve KYC submissions
    const kycData = await KYC.create({
      userId,
      aadhaar,
      dob,
      gender,
      phone,
      email,
      emergency_contact,
      trip_itinerary,
      verified: false, // Requires admin verification
    });

    // 💡 2. Generate a more robust, unique Tourist ID
    const touristId = `TID-${nanoid(8)}`; // Example: TID-vchz78y4

    // 💡 3. Update the user record
    await User.findByIdAndUpdate(userId, {
      touristId,
      kycStatus: "approved",
    });

    res.status(201).json({ msg: "KYC submitted successfully", touristId, kycData });

  } catch (err: any) {
    console.error("🔥 KYC Error:", err);
    res.status(500).json({ error: err.message  });
  }
});

export default router;