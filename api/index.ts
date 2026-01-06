import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import mongoose from 'mongoose';

import { typeDefs } from '../src/graphql/typeDefs';
import { resolvers } from '../src/graphql/resolvers';
import { extractTokenFromHeader, verifyToken, Context } from '../src/utils/auth';
import { createLoaders, Loaders } from '../src/utils/dataloader';

interface ServerContext extends Context {
  loaders: Loaders;
}

const app = express();

// MongoDB connection (cached for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tms';
  
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Create Apollo Server
const server = new ApolloServer<ServerContext>({
  typeDefs,
  resolvers,
  introspection: true,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_ERROR',
      path: error.path
    };
  }
});

// Start server promise
const serverStarted = server.start();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api', (_, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// GraphQL endpoint
app.use('/api/graphql', async (req, res, next) => {
  await connectDB();
  await serverStarted;
  
  return expressMiddleware(server, {
    context: async ({ req }): Promise<ServerContext> => {
      const token = extractTokenFromHeader(req.headers.authorization);
      const user = token ? verifyToken(token) : null;
      const loaders = createLoaders();

      return { user, token, loaders };
    }
  })(req, res, next);
});

export default app;

