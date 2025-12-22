import 'reflect-metadata';
import 'dotenv/config';
import { app } from './app';
import { AppDataSource } from './config/data-source';

const startServer = async () => {
  const port = Number(process.env.PORT);
  const validPort = !isNaN(port) && port > 0 && port <= 65535 ? port : 3333;
  
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    app.listen(validPort, () => {
      console.log(`🚀 Server is running on port ${validPort}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Only auto-start server if this file is run directly (not when imported in tests)
if (require.main === module) {
  startServer();
}

export { startServer };
