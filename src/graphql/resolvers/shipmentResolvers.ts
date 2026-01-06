import { GraphQLError } from 'graphql';
import { Shipment, IShipment, ShipmentStatus } from '../../models/Shipment';
import { UserRole } from '../../models/User';
import { requireAuth, requireAdmin, requireRole, Context } from '../../utils/auth';
import { 
  normalizeLimit, 
  calculateOffset, 
  createPaginationResult,
  PaginationParams 
} from '../../utils/pagination';
import { Loaders } from '../../utils/dataloader';

interface ShipmentFilterInput {
  status?: ShipmentStatus[];
  priority?: string[];
  type?: string[];
  carrier?: string;
  isFlagged?: boolean;
  originCity?: string;
  originState?: string;
  destinationCity?: string;
  destinationState?: string;
  minCost?: number;
  maxCost?: number;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  createdFrom?: string;
  createdTo?: string;
  search?: string;
}

interface ShipmentSortInput {
  field: string;
  order: 'ASC' | 'DESC';
}

interface CreateShipmentInput {
  status?: ShipmentStatus;
  priority?: string;
  type?: string;
  origin: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
  };
  destination: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
  };
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  specialInstructions?: string;
  carrier: string;
  estimatedDelivery: string;
  cost: number;
  insurance?: number;
  assignedDriver?: string;
  vehicleId?: string;
}

interface UpdateShipmentInput {
  status?: ShipmentStatus;
  priority?: string;
  type?: string;
  origin?: CreateShipmentInput['origin'];
  destination?: CreateShipmentInput['destination'];
  weight?: number;
  dimensions?: CreateShipmentInput['dimensions'];
  description?: string;
  specialInstructions?: string;
  carrier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cost?: number;
  insurance?: number;
  isFlagged?: boolean;
  flagReason?: string;
  assignedDriver?: string;
  vehicleId?: string;
}

const sortFieldMap: Record<string, string> = {
  TRACKING_NUMBER: 'trackingNumber',
  STATUS: 'status',
  PRIORITY: 'priority',
  CARRIER: 'carrier',
  ESTIMATED_DELIVERY: 'estimatedDelivery',
  COST: 'cost',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
};

const buildFilterQuery = (filter?: ShipmentFilterInput) => {
  const query: Record<string, unknown> = {};

  if (!filter) return query;

  if (filter.status?.length) {
    query.status = { $in: filter.status };
  }

  if (filter.priority?.length) {
    query.priority = { $in: filter.priority };
  }

  if (filter.type?.length) {
    query.type = { $in: filter.type };
  }

  if (filter.carrier) {
    query.carrier = new RegExp(filter.carrier, 'i');
  }

  if (typeof filter.isFlagged === 'boolean') {
    query.isFlagged = filter.isFlagged;
  }

  if (filter.originCity) {
    query['origin.city'] = new RegExp(filter.originCity, 'i');
  }

  if (filter.originState) {
    query['origin.state'] = new RegExp(filter.originState, 'i');
  }

  if (filter.destinationCity) {
    query['destination.city'] = new RegExp(filter.destinationCity, 'i');
  }

  if (filter.destinationState) {
    query['destination.state'] = new RegExp(filter.destinationState, 'i');
  }

  if (filter.minCost !== undefined || filter.maxCost !== undefined) {
    query.cost = {};
    if (filter.minCost !== undefined) {
      (query.cost as Record<string, number>).$gte = filter.minCost;
    }
    if (filter.maxCost !== undefined) {
      (query.cost as Record<string, number>).$lte = filter.maxCost;
    }
  }

  if (filter.estimatedDeliveryFrom || filter.estimatedDeliveryTo) {
    query.estimatedDelivery = {};
    if (filter.estimatedDeliveryFrom) {
      (query.estimatedDelivery as Record<string, Date>).$gte = new Date(filter.estimatedDeliveryFrom);
    }
    if (filter.estimatedDeliveryTo) {
      (query.estimatedDelivery as Record<string, Date>).$lte = new Date(filter.estimatedDeliveryTo);
    }
  }

  if (filter.createdFrom || filter.createdTo) {
    query.createdAt = {};
    if (filter.createdFrom) {
      (query.createdAt as Record<string, Date>).$gte = new Date(filter.createdFrom);
    }
    if (filter.createdTo) {
      (query.createdAt as Record<string, Date>).$lte = new Date(filter.createdTo);
    }
  }

  if (filter.search) {
    query.$text = { $search: filter.search };
  }

  return query;
};

export const shipmentResolvers = {
  Shipment: {
    id: (parent: IShipment) => parent._id.toString(),
    createdBy: async (
      parent: IShipment, 
      _: unknown, 
      context: Context & { loaders: Loaders }
    ) => {
      if (!parent.createdBy) return null;
      return context.loaders.userLoader.load(parent.createdBy.toString());
    },
    lastUpdatedBy: async (
      parent: IShipment, 
      _: unknown, 
      context: Context & { loaders: Loaders }
    ) => {
      if (!parent.lastUpdatedBy) return null;
      return context.loaders.userLoader.load(parent.lastUpdatedBy.toString());
    }
  },

  Query: {
    shipments: async (
      _: unknown,
      args: PaginationParams & { filter?: ShipmentFilterInput; sort?: ShipmentSortInput },
      context: Context
    ) => {
      requireAuth(context);

      const limit = normalizeLimit(args.limit || args.first);
      const page = args.page || 1;
      const offset = calculateOffset(page, limit);

      const query = buildFilterQuery(args.filter);

      // Build sort
      let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
      if (args.sort) {
        const sortField = sortFieldMap[args.sort.field] || 'createdAt';
        sortOption = { [sortField]: args.sort.order === 'ASC' ? 1 : -1 };
      }

      const [shipments, totalCount] = await Promise.all([
        Shipment.find(query)
          .sort(sortOption)
          .skip(offset)
          .limit(limit)
          .lean(),
        Shipment.countDocuments(query)
      ]);

      return createPaginationResult(shipments as unknown as IShipment[], totalCount, page, limit);
    },

    shipment: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAuth(context);
      const shipment = await Shipment.findById(id);
      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return shipment;
    },

    shipmentByTracking: async (
      _: unknown, 
      { trackingNumber }: { trackingNumber: string }, 
      context: Context
    ) => {
      requireAuth(context);
      const shipment = await Shipment.findOne({ trackingNumber });
      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return shipment;
    },

    shipmentStats: async (_: unknown, __: unknown, context: Context) => {
      requireAuth(context);

      const [stats, flaggedCount, costStats] = await Promise.all([
        Shipment.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        Shipment.countDocuments({ isFlagged: true }),
        Shipment.aggregate([
          {
            $group: {
              _id: null,
              avgCost: { $avg: '$cost' },
              totalCost: { $sum: '$cost' },
              total: { $sum: 1 }
            }
          }
        ])
      ]);

      const statusCounts = stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      const costData = costStats[0] || { avgCost: 0, totalCost: 0, total: 0 };

      return {
        total: costData.total,
        pending: statusCounts[ShipmentStatus.PENDING] || 0,
        inTransit: (statusCounts[ShipmentStatus.IN_TRANSIT] || 0) + 
                   (statusCounts[ShipmentStatus.PICKED_UP] || 0) +
                   (statusCounts[ShipmentStatus.OUT_FOR_DELIVERY] || 0),
        delivered: statusCounts[ShipmentStatus.DELIVERED] || 0,
        delayed: statusCounts[ShipmentStatus.DELAYED] || 0,
        cancelled: statusCounts[ShipmentStatus.CANCELLED] || 0,
        flagged: flaggedCount,
        avgCost: Math.round((costData.avgCost || 0) * 100) / 100,
        totalCost: Math.round((costData.totalCost || 0) * 100) / 100
      };
    }
  },

  Mutation: {
    createShipment: async (
      _: unknown,
      { input }: { input: CreateShipmentInput },
      context: Context
    ) => {
      const authUser = requireAuth(context);

      const shipment = new Shipment({
        ...input,
        estimatedDelivery: new Date(input.estimatedDelivery),
        createdBy: authUser.userId,
        lastUpdatedBy: authUser.userId
      });

      await shipment.save();
      return shipment;
    },

    updateShipment: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateShipmentInput },
      context: Context
    ) => {
      const authUser = requireAuth(context);

      const updateData: Record<string, unknown> = {
        ...input,
        lastUpdatedBy: authUser.userId
      };

      if (input.estimatedDelivery) {
        updateData.estimatedDelivery = new Date(input.estimatedDelivery);
      }
      if (input.actualDelivery) {
        updateData.actualDelivery = new Date(input.actualDelivery);
      }

      const shipment = await Shipment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return shipment;
    },

    deleteShipment: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireRole(context, [UserRole.ADMIN]);

      const shipment = await Shipment.findByIdAndDelete(id);
      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return {
        success: true,
        message: 'Shipment deleted successfully',
        deletedId: id
      };
    },

    flagShipment: async (
      _: unknown,
      { id, reason }: { id: string; reason: string },
      context: Context
    ) => {
      const authUser = requireAuth(context);

      const shipment = await Shipment.findByIdAndUpdate(
        id,
        {
          $set: {
            isFlagged: true,
            flagReason: reason,
            lastUpdatedBy: authUser.userId
          }
        },
        { new: true }
      );

      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return shipment;
    },

    unflagShipment: async (_: unknown, { id }: { id: string }, context: Context) => {
      const authUser = requireAuth(context);

      const shipment = await Shipment.findByIdAndUpdate(
        id,
        {
          $set: {
            isFlagged: false,
            flagReason: null,
            lastUpdatedBy: authUser.userId
          }
        },
        { new: true }
      );

      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return shipment;
    },

    updateShipmentStatus: async (
      _: unknown,
      { id, status }: { id: string; status: ShipmentStatus },
      context: Context
    ) => {
      const authUser = requireAuth(context);

      const updateData: Record<string, unknown> = {
        status,
        lastUpdatedBy: authUser.userId
      };

      // Set actual delivery date when delivered
      if (status === ShipmentStatus.DELIVERED) {
        updateData.actualDelivery = new Date();
      }

      const shipment = await Shipment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return shipment;
    },

    bulkUpdateStatus: async (
      _: unknown,
      { ids, status }: { ids: string[]; status: ShipmentStatus },
      context: Context
    ) => {
      requireRole(context, [UserRole.ADMIN]);
      const authUser = context.user!;

      const updateData: Record<string, unknown> = {
        status,
        lastUpdatedBy: authUser.userId
      };

      if (status === ShipmentStatus.DELIVERED) {
        updateData.actualDelivery = new Date();
      }

      await Shipment.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );

      return Shipment.find({ _id: { $in: ids } });
    }
  }
};

