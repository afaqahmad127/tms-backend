import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { IUser, UserRole } from '../models/User';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface Context {
  user: JwtPayload | null;
  token: string | null;
}

export const generateToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
  } catch {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

export const requireAuth = (context: Context): JwtPayload => {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

export const requireAdmin = (context: Context): JwtPayload => {
  const user = requireAuth(context);
  if (user.role !== UserRole.ADMIN) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

export const requireRole = (context: Context, roles: UserRole[]): JwtPayload => {
  const user = requireAuth(context);
  if (!roles.includes(user.role)) {
    throw new GraphQLError(`Access denied. Required roles: ${roles.join(', ')}`, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

