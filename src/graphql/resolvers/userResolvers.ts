import { GraphQLError } from 'graphql';
import { User, IUser, UserRole } from '../../models/User';
import { generateToken, requireAuth, requireAdmin, Context } from '../../utils/auth';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  department?: string;
  avatar?: string;
}

export const userResolvers = {
  User: {
    id: (parent: IUser) => parent._id.toString(),
    fullName: (parent: IUser) => `${parent.firstName} ${parent.lastName}`
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      const authUser = requireAuth(context);
      return User.findById(authUser.userId);
    },

    users: async (_: unknown, __: unknown, context: Context) => {
      requireAdmin(context);
      return User.find({ isActive: true }).sort({ createdAt: -1 });
    },

    user: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAdmin(context);
      return User.findById(id);
    }
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: RegisterInput }) => {
      const existingUser = await User.findOne({ email: input.email.toLowerCase() });
      if (existingUser) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const user = new User({
        ...input,
        role: UserRole.EMPLOYEE // Default role for new users
      });

      await user.save();
      const token = generateToken(user);

      return { token, user };
    },

    login: async (_: unknown, { input }: { input: LoginInput }) => {
      const user = await User.findOne({ email: input.email.toLowerCase() });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      if (!user.isActive) {
        throw new GraphQLError('Account is deactivated', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const isValidPassword = await user.comparePassword(input.password);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const token = generateToken(user);
      return { token, user };
    },

    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      context: Context
    ) => {
      const authUser = requireAuth(context);
      
      // Users can update their own profile, admins can update anyone
      if (authUser.userId !== id && authUser.role !== UserRole.ADMIN) {
        throw new GraphQLError('Not authorized to update this user', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return user;
    },

    updateUserRole: async (
      _: unknown,
      { id, role }: { id: string; role: UserRole },
      context: Context
    ) => {
      requireAdmin(context);

      const user = await User.findByIdAndUpdate(
        id,
        { $set: { role } },
        { new: true }
      );

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return user;
    },

    deactivateUser: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return user;
    }
  }
};

