export const typeDefs = `#graphql
  # Enums
  enum UserRole {
    ADMIN
    EMPLOYEE
  }

  enum ShipmentStatus {
    PENDING
    PICKED_UP
    IN_TRANSIT
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
    DELAYED
    RETURNED
  }

  enum ShipmentPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum ShipmentType {
    STANDARD
    EXPRESS
    OVERNIGHT
    FREIGHT
    HAZMAT
    REFRIGERATED
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum ShipmentSortField {
    TRACKING_NUMBER
    STATUS
    PRIORITY
    CARRIER
    ESTIMATED_DELIVERY
    COST
    CREATED_AT
    UPDATED_AT
  }

  # Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    role: UserRole!
    department: String!
    avatar: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Address {
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String!
    contactName: String!
    contactPhone: String!
    contactEmail: String
  }

  type Dimensions {
    length: Float!
    width: Float!
    height: Float!
  }

  type Shipment {
    id: ID!
    trackingNumber: String!
    status: ShipmentStatus!
    priority: ShipmentPriority!
    type: ShipmentType!
    origin: Address!
    destination: Address!
    weight: Float!
    dimensions: Dimensions!
    description: String!
    specialInstructions: String
    carrier: String!
    estimatedDelivery: String!
    actualDelivery: String
    cost: Float!
    insurance: Float!
    isFlagged: Boolean!
    flagReason: String
    assignedDriver: String
    vehicleId: String
    createdBy: User
    lastUpdatedBy: User
    createdAt: String!
    updatedAt: String!
  }

  type ShipmentConnection {
    edges: [ShipmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ShipmentEdge {
    node: Shipment!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalPages: Int!
    currentPage: Int!
  }

  type ShipmentStats {
    total: Int!
    pending: Int!
    inTransit: Int!
    delivered: Int!
    delayed: Int!
    cancelled: Int!
    flagged: Int!
    avgCost: Float!
    totalCost: Float!
  }

  type DeleteResponse {
    success: Boolean!
    message: String!
    deletedId: ID
  }

  # Input Types
  input AddressInput {
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String = "USA"
    contactName: String!
    contactPhone: String!
    contactEmail: String
  }

  input DimensionsInput {
    length: Float!
    width: Float!
    height: Float!
  }

  input CreateShipmentInput {
    status: ShipmentStatus
    priority: ShipmentPriority
    type: ShipmentType
    origin: AddressInput!
    destination: AddressInput!
    weight: Float!
    dimensions: DimensionsInput!
    description: String!
    specialInstructions: String
    carrier: String!
    estimatedDelivery: String!
    cost: Float!
    insurance: Float
    assignedDriver: String
    vehicleId: String
  }

  input UpdateShipmentInput {
    status: ShipmentStatus
    priority: ShipmentPriority
    type: ShipmentType
    origin: AddressInput
    destination: AddressInput
    weight: Float
    dimensions: DimensionsInput
    description: String
    specialInstructions: String
    carrier: String
    estimatedDelivery: String
    actualDelivery: String
    cost: Float
    insurance: Float
    isFlagged: Boolean
    flagReason: String
    assignedDriver: String
    vehicleId: String
  }

  input ShipmentFilterInput {
    status: [ShipmentStatus!]
    priority: [ShipmentPriority!]
    type: [ShipmentType!]
    carrier: String
    isFlagged: Boolean
    originCity: String
    originState: String
    destinationCity: String
    destinationState: String
    minCost: Float
    maxCost: Float
    estimatedDeliveryFrom: String
    estimatedDeliveryTo: String
    createdFrom: String
    createdTo: String
    search: String
  }

  input ShipmentSortInput {
    field: ShipmentSortField!
    order: SortOrder!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    department: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    department: String
    avatar: String
  }

  # Queries
  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Shipment queries
    shipments(
      filter: ShipmentFilterInput
      sort: ShipmentSortInput
      first: Int
      after: String
      last: Int
      before: String
      page: Int
      limit: Int
    ): ShipmentConnection!

    shipment(id: ID!): Shipment
    shipmentByTracking(trackingNumber: String!): Shipment
    shipmentStats: ShipmentStats!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # User mutations (Admin only)
    updateUser(id: ID!, input: UpdateUserInput!): User!
    updateUserRole(id: ID!, role: UserRole!): User!
    deactivateUser(id: ID!): User!

    # Shipment mutations
    createShipment(input: CreateShipmentInput!): Shipment!
    updateShipment(id: ID!, input: UpdateShipmentInput!): Shipment!
    deleteShipment(id: ID!): DeleteResponse!
    flagShipment(id: ID!, reason: String!): Shipment!
    unflagShipment(id: ID!): Shipment!
    updateShipmentStatus(id: ID!, status: ShipmentStatus!): Shipment!
    bulkUpdateStatus(ids: [ID!]!, status: ShipmentStatus!): [Shipment!]!
  }
`;

