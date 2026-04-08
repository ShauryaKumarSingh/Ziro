"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = "MY_SECRET_KEY"; // ⚠️ later move to .env
// =================== SIGNUP ===================
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // check existing user
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json({ msg: "User already exists" });
        // hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // create new user
        const newUser = new User_1.default({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ msg: "User registered successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// =================== LOGIN ===================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // check user
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ msg: "Invalid credentials" });
        // compare password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Invalid credentials" });
        // generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
// =================== PROFILE ===================
router.get("/profile", auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user?.id).select("-password"); // exclude password
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            kycStatus: user.kycStatus,
            touristId: user.touristId || null,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
