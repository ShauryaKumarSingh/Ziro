import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import type { IUser } from "../models/User";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();
const JWT_SECRET = "MY_SECRET_KEY"; // ⚠️ later move to .env

// =================== SIGNUP ===================
router.post("/signup", async (req: Request, res: Response) => {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =================== LOGIN ===================
router.post("/login", async (req: Request, res: Response) => {
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

export default router;
