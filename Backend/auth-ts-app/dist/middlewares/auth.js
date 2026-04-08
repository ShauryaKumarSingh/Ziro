"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = "MY_SECRET_KEY"; // move to .env later
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // "Bearer <token>"
    if (!token)
        return res.status(401).json({ msg: "No token, authorization denied" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    }
    catch (err) {
        return res.status(401).json({ msg: "Token is not valid" });
    }
};
exports.authMiddleware = authMiddleware;
