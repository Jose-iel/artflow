import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { errors as celebrateErrors } from 'celebrate';
import AppError from './utils/AppError';
import routes from './routes';

class App {
  public express: Application;

  constructor() {
    this.express = express();
    this.middlewares();
    this.routes();
    this.errorHandler();
  }

  private middlewares(): void {
    this.express.use(express.json());
    
    // Handle multiple CORS origins
    const corsOrigin = process.env.CORS_ORIGIN;
    let origins: string[] | string | boolean = '*';
    
    if (corsOrigin) {
      // Split comma-separated origins into array
      origins = corsOrigin.split(',').map(origin => origin.trim());
    }
    
    this.express.use(cors({
      origin: origins,
      credentials: true
    }));
  }

  private routes(): void {
    this.express.use('/api', routes);
  }

  private errorHandler(): void {
    this.express.use(celebrateErrors());

    this.express.use((error: Error, req: Request, res: Response, _: NextFunction) => {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message,
        });
      }

      console.error('Internal server error:', error);

      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    });
  }
}

export default App;
export { App };

// Export express instance for server.ts
export const app = new App().express;
