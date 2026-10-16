import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN' | 'STATION_OPERATOR';
export type AuthProvider = 'local' | 'google' | 'github';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  googleId?: string;
  githubId?: string;
  role: UserRole;
  verified: boolean;
  avatar?: string;
  greenPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // Optional: users who sign up via Google/GitHub have no local password.
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['USER', 'ADMIN', 'STATION_OPERATOR'], default: 'USER' },
    verified: { type: Boolean, default: false },
    avatar: { type: String },
    greenPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<IUser>('User', UserSchema);
