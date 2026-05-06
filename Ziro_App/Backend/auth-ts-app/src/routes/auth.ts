import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import type { IUser } from "../models/User";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { validate, signupSchema, loginSchema } from "../middlewares/validation";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_production";

// =================== SIGNUP ===================
router.post("/signup", validate(signupSchema), async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const newUser: IUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error: any) {
  console.error("❌ SIGNUP CRASHED:", error.message);
  res.status(500).json({ error: "Server error", details: error.message });
}
});

// =================== LOGIN ===================
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // generate JWT
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =================== PROFILE ===================
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password"); // exclude password

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      kycStatus: user.kycStatus,
      touristId: user.touristId || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =================== POLICE LOGIN ===================
router.post("/police-login", async (req: Request, res: Response) => {
  try {
    const { masterKey } = req.body;
    console.log('🔐 Police login attempt:', { masterKey: masterKey ? 'provided' : 'missing', body: req.body });

    // Check for master key (you can store this in env or database)
    const POLICE_MASTER_KEY = process.env.POLICE_MASTER_KEY || "ziro-police-2024-master-key";
    console.log('🔑 Expected master key:', POLICE_MASTER_KEY);

    if (masterKey !== POLICE_MASTER_KEY) {
      console.log('❌ Master key mismatch');
      return res.status(401).json({ msg: "Invalid master key" });
    }

    console.log('✅ Master key valid, generating token');

    // Generate JWT for police dashboard (longer expiry for dashboard)
    const token = jwt.sign(
      {
        id: "police-dashboard",
        role: "police",
        permissions: ["dashboard", "sos-tracking", "emergency-response"]
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log('🎫 Token generated successfully');

    res.json({
      token,
      user: {
        id: "police-dashboard",
        username: "Police Dashboard",
        email: "police@ziro.com",
        role: "police"
      },
      message: "Police dashboard access granted"
    });
  } catch (err) {
    console.error('❌ Police login error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
