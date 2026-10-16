import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken } from '../utils/tokens';

const SALT_ROUNDS = 12;

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone,
    passwordHash,
    role: 'USER',
  });
  return issueTokens(user);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  if (!user.passwordHash) {
    throw new ApiError(
      400,
      'OAUTH_ONLY_ACCOUNT',
      `This account signed up with ${user.authProvider === 'google' ? 'Google' : 'GitHub'}. Use "Continue with ${
        user.authProvider === 'google' ? 'Google' : 'GitHub'
      }" to sign in.`
    );
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  return issueTokens(user);
}

export function issueTokens(user: IUser) {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      greenPoints: user.greenPoints,
    },
  };
}
