// models/KYC.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IKYC extends Document {
  userId: mongoose.Types.ObjectId;
  aadhaar: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  emergency_contact: string;
  trip_itinerary: string;
  verified: boolean;
}

const kycSchema = new Schema<IKYC>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Added unique constraint
  aadhaar: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  emergency_contact: { type: String, required: true },
  trip_itinerary: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { timestamps: true });


export default mongoose.model<IKYC>("KYC", kycSchema);
