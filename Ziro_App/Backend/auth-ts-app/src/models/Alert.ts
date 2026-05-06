import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  touristId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'resolved';
}

const alertSchema = new Schema<IAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  touristId: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
}, { timestamps: true });

export default mongoose.model<IAlert>('Alert', alertSchema);