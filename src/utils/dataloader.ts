import DataLoader from 'dataloader';
import { User, IUser } from '../models/User';

// Batch function to load users by IDs
const batchUsers = async (userIds: readonly string[]): Promise<(IUser | null)[]> => {
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map(user => [user._id.toString(), user]));
  return userIds.map(id => userMap.get(id) || null);
};

// Create data loaders for each request
export const createLoaders = () => ({
  userLoader: new DataLoader<string, IUser | null>(batchUsers, {
    cache: true,
    cacheKeyFn: (key) => key.toString()
  })
});

export type Loaders = ReturnType<typeof createLoaders>;

