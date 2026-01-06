import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import mongoose from 'mongoose';

import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { extractTokenFromHeader, verifyToken, Context } from './utils/auth';
import { createLoaders, Loaders } from './utils/dataloader';

interface ServerContext extends Context {
  loaders: Loaders;
}

const startServer = async () => {
  const app = express();

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tms';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  // Create Apollo Server
  const server = new ApolloServer<ServerContext>({
    typeDefs,
    resolvers,
    introspection: true, // Enable for demo purposes
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_ERROR',
        path: error.path
      };
    }
  });

  await server.start();

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }): Promise<ServerContext> => {
        const token = extractTokenFromHeader(req.headers.authorization);
        const user = token ? verifyToken(token) : null;
        const loaders = createLoaders();

        return { user, token, loaders };
      }
    })
  );

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`
🚀 TMS GraphQL Server is running!
📡 GraphQL endpoint: http://localhost:${PORT}/graphql
❤️  Health check: http://localhost:${PORT}/health
🔧 Environment: ${process.env.NODE_ENV || 'development'}
    `);
  });
};

startServer().catch(console.error);

