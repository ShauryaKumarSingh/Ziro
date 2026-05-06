// models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  touristId?: string;
  kycStatus: "pending" | "approved" | "rejected";
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  touristId: { type: String },
  kycStatus: { type: String, default: "pending" },
});

export default mongoose.model<IUser>("User", userSchema);
