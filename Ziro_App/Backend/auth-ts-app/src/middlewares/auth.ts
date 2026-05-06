import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io"; 

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_production";

// Use an Intersection Type (&) instead of Interface Extends.
// This bypasses the "incorrectly extends" error.
export type AuthRequest = Request & {
  user?: { id: string };
  io?: Server;
};

// We use 'any' for 'req' here to ensure the compiler stops blocking the build
export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1]; 

  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};