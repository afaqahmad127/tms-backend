import { userResolvers } from './userResolvers';
import { shipmentResolvers } from './shipmentResolvers';

// Merge resolvers
export const resolvers = {
  User: userResolvers.User,
  Shipment: shipmentResolvers.Shipment,
  
  Query: {
    ...userResolvers.Query,
    ...shipmentResolvers.Query
  } as Record<string, unknown>,
  
  Mutation: {
    ...userResolvers.Mutation,
    ...shipmentResolvers.Mutation
  } as Record<string, unknown>
};

