import { User, type IUser } from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

function mapRole(role: string): string {
  return role === 'USER' ? 'MEMBER' : role;
}

function toUserDTO(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: mapRole(user.role),
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt.toISOString(),
  };
}

export const authService = {
  async signup(name: string, email: string, password: string) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }

    const user = await User.create({ name, email, password });
    const token = signToken({ userId: user._id.toString(), role: user.role });

    return { token, user: toUserDTO(user) };
  },

  async login(email: string, password: string) {
    // +password because the field has select: false on the schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new ApiError(403, 'Account suspended');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return { token, user: toUserDTO(user) };
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return toUserDTO(user);
  },
};
