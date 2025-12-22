import { AppDataSource } from '../../config/data-source';
import { app } from '../../app';

// Mock the dependencies
jest.mock('../../config/data-source');
jest.mock('../../app', () => ({
  app: {
    listen: jest.fn()
  }
}));

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
// @ts-ignore - Type casting issue with SpyInstance to Mock
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation() as jest.Mock;

describe('Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.PORT;
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('startServer', () => {
    it('should start server successfully with default port', async () => {
      // Arrange
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));
      expect(mockConsoleLog).toHaveBeenCalledWith('Database connected');
      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server is running on port 3333');
    });

    it('should start server with custom PORT from environment', async () => {
      // Arrange
      process.env.PORT = '4000';
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));
      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server is running on port 4000');
    });

    it('should handle database initialization error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockRejectedValue(dbError);

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockInitialize).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith('Error starting server:', dbError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should load reflect-metadata and dotenv', async () => {
      // This test verifies that the imports are present
      // We can't easily test the side effects of these imports
      // but we can verify the module loads without errors
      
      // Act
      const serverModule = require('../../server');
      
      // Assert
      expect(serverModule).toBeDefined();
      expect(typeof serverModule.startServer).toBe('function');
    });
  });

  describe('Environment Configuration', () => {
    it('should use default port when PORT is not set', async () => {
      // Arrange
      delete process.env.PORT;
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));
    });

    it('should use string PORT from environment', async () => {
      // Arrange
      process.env.PORT = '5000';
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(5000, expect.any(Function));
    });

    it('should use default port when PORT is invalid string', async () => {
      // Arrange
      process.env.PORT = 'abc';
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));
    });

    it('should use default port when PORT is zero', async () => {
      // Arrange
      process.env.PORT = '0';
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));
    });

    it('should handle negative PORT values', async () => {
      // Arrange
      process.env.PORT = '-1';
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation((port, callback) => {
        callback();
      });

      // Act
      const { startServer } = require('../../server');
      await startServer();

      // Assert
      expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));
    });
  });

  describe('Module Auto-start Behavior', () => {
    it('should not auto-start server when imported', () => {
      // Arrange
      const mockInitialize = (AppDataSource.initialize as jest.Mock).mockResolvedValue(undefined);
      const mockListen = (app.listen as jest.Mock).mockImplementation();

      // Act - just import the module
      require('../../server');

      // Assert - server should not start automatically when imported
      expect(mockInitialize).not.toHaveBeenCalled();
      expect(mockListen).not.toHaveBeenCalled();
    });

    it('should export startServer function', () => {
      // Act
      const serverModule = require('../../server');

      // Assert
      expect(serverModule.startServer).toBeDefined();
      expect(typeof serverModule.startServer).toBe('function');
    });
  });
});
