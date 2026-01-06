import mongoose, { Document, Schema } from 'mongoose';

export enum ShipmentStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED',
  RETURNED = 'RETURNED'
}

export enum ShipmentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ShipmentType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  FREIGHT = 'FREIGHT',
  HAZMAT = 'HAZMAT',
  REFRIGERATED = 'REFRIGERATED'
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
}

export interface IShipment extends Document {
  _id: mongoose.Types.ObjectId;
  trackingNumber: string;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  type: ShipmentType;
  origin: IAddress;
  destination: IAddress;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  specialInstructions?: string;
  carrier: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  cost: number;
  insurance: number;
  isFlagged: boolean;
  flagReason?: string;
  assignedDriver?: string;
  vehicleId?: string;
  createdBy: mongoose.Types.ObjectId;
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String }
  },
  { _id: false }
);

const shipmentSchema = new Schema<IShipment>(
  {
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.PENDING,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(ShipmentPriority),
      default: ShipmentPriority.MEDIUM,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(ShipmentType),
      default: ShipmentType.STANDARD
    },
    origin: {
      type: addressSchema,
      required: true
    },
    destination: {
      type: addressSchema,
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0.1
    },
    dimensions: {
      length: { type: Number, required: true, min: 0.1 },
      width: { type: Number, required: true, min: 0.1 },
      height: { type: Number, required: true, min: 0.1 }
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    specialInstructions: {
      type: String,
      maxlength: 1000
    },
    carrier: {
      type: String,
      required: true,
      index: true
    },
    estimatedDelivery: {
      type: Date,
      required: true,
      index: true
    },
    actualDelivery: {
      type: Date
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    insurance: {
      type: Number,
      default: 0,
      min: 0
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flagReason: {
      type: String
    },
    assignedDriver: {
      type: String
    },
    vehicleId: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common queries
shipmentSchema.index({ status: 1, priority: 1 });
shipmentSchema.index({ carrier: 1, status: 1 });
shipmentSchema.index({ estimatedDelivery: 1, status: 1 });
shipmentSchema.index({ 'destination.city': 1, 'destination.state': 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ updatedAt: -1 });

// Text index for search
shipmentSchema.index({
  trackingNumber: 'text',
  description: 'text',
  'origin.city': 'text',
  'destination.city': 'text',
  carrier: 'text'
});

// Generate tracking number
shipmentSchema.pre('save', function (next) {
  if (!this.trackingNumber) {
    const prefix = 'TMS';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

export const Shipment = mongoose.model<IShipment>('Shipment', shipmentSchema);

