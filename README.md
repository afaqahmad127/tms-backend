## TMS Backend - GraphQL API

A robust Transportation Management System backend built with Node.js, Express, Apollo Server (GraphQL), and MongoDB.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/Employee)
- 📦 **Shipment Management**: Full CRUD operations with advanced filtering and pagination
- 🔍 **GraphQL API**: Type-safe queries and mutations
- 📊 **Performance Optimizations**: DataLoader for N+1 prevention, database indexing
- 🛡️ **Security**: Password hashing, input validation, error handling

## Tech Stack

- Node.js + Express
- Apollo Server 4 (GraphQL)
- MongoDB + Mongoose
- TypeScript
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create `.env` file:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/tms
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000
\`\`\`

3. Seed the database:
\`\`\`bash
npm run seed
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

### Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm run seed\` - Seed database with sample data

## API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## GraphQL Schema

### Queries

\`\`\`graphql
# User queries
me: User
users: [User!]! (Admin only)

# Shipment queries
shipments(filter, sort, pagination): ShipmentConnection!
shipment(id: ID!): Shipment
shipmentByTracking(trackingNumber: String!): Shipment
shipmentStats: ShipmentStats!
\`\`\`

### Mutations

\`\`\`graphql
# Auth
register(input: RegisterInput!): AuthPayload!
login(input: LoginInput!): AuthPayload!

# Shipments
createShipment(input: CreateShipmentInput!): Shipment!
updateShipment(id: ID!, input: UpdateShipmentInput!): Shipment!
deleteShipment(id: ID!): DeleteResponse! (Admin only)
flagShipment(id: ID!, reason: String!): Shipment!
updateShipmentStatus(id: ID!, status: ShipmentStatus!): Shipment!
\`\`\`

## Test Credentials

- **Admin**: admin@tms.com / admin123
- **Employee**: employee@tms.com / employee123

## Role Permissions

| Feature | Admin | Employee |
|---------|-------|----------|
| View Shipments | ✅ | ✅ |
| Create Shipments | ✅ | ✅ |
| Update Shipments | ✅ | ✅ |
| Delete Shipments | ✅ | ❌ |
| Bulk Operations | ✅ | ❌ |
| User Management | ✅ | ❌ |

