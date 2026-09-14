const app = require('./src/app');
const connectDB = require('./src/config/database');
const env = require('./src/config/environment');

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] RBAC Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Server] SIGTERM received, closing HTTP server...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('[Server Error]', err);
    process.exit(1);
  }
};

startServer();
