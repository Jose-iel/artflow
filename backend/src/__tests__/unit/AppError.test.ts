import AppError from '../../utils/AppError';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create AppError with default statusCode 400', () => {
      // Arrange
      const errorMessage = 'Test error message';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with custom statusCode', () => {
      // Arrange
      const errorMessage = 'Custom error message';
      const customStatusCode = 422;

      // Act
      const error = new AppError(errorMessage, customStatusCode);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(customStatusCode);
    });

    it('should create AppError with zero statusCode', () => {
      // Arrange
      const errorMessage = 'Error with zero status';

      // Act
      const error = new AppError(errorMessage, 0);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(0);
    });

    it('should create AppError with negative statusCode', () => {
      // Arrange
      const errorMessage = 'Error with negative status';

      // Act
      const error = new AppError(errorMessage, -1);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(-1);
    });

    it('should create AppError with empty message', () => {
      // Arrange
      const errorMessage = '';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe('');
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with whitespace message', () => {
      // Arrange
      const errorMessage = '   ';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe('   ');
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with long message', () => {
      // Arrange
      const errorMessage = 'A'.repeat(1000);

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with special characters in message', () => {
      // Arrange
      const errorMessage = 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with Unicode characters in message', () => {
      // Arrange
      const errorMessage = 'Erro com caracteres especiais: ñáéíóú 🚀';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('properties', () => {
    it('should have correct message property', () => {
      // Arrange
      const errorMessage = 'Test message';

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe(errorMessage);
    });

    it('should have correct statusCode property', () => {
      // Arrange
      const statusCode = 500;

      // Act
      const error = new AppError('Test message', statusCode);

      // Assert
      expect(error.statusCode).toBe(statusCode);
    });
  });

  describe('inheritance', () => {
    it('should extend Error class properly', () => {
      // Arrange
      const error = new AppError('Test error');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('Error');
    });

    it('should have correct stack trace', () => {
      // Arrange
      const error = new AppError('Test error');

      // Assert
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('AppError');
    });
  });

  describe('common HTTP status codes', () => {
    it('should work with common HTTP status codes', () => {
      const testCases = [
        { message: 'Bad Request', code: 400 },
        { message: 'Unauthorized', code: 401 },
        { message: 'Forbidden', code: 403 },
        { message: 'Not Found', code: 404 },
        { message: 'Internal Server Error', code: 500 },
        { message: 'Service Unavailable', code: 503 }
      ];

      testCases.forEach(({ message, code }) => {
        // Act
        const error = new AppError(message, code);

        // Assert
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(code);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null message gracefully', () => {
      // Arrange
      const errorMessage = null as any;

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe('null'); // Error constructor converts null to string
      expect(error.statusCode).toBe(400);
    });

    it('should handle undefined message gracefully', () => {
      // Arrange
      const errorMessage = undefined as any;

      // Act
      const error = new AppError(errorMessage);

      // Assert
      expect(error.message).toBe(''); // Error constructor converts undefined to empty string
      expect(error.statusCode).toBe(400);
    });

    it('should handle very large status codes', () => {
      // Arrange
      const errorMessage = 'Large status code';
      const largeCode = 999999;

      // Act
      const error = new AppError(errorMessage, largeCode);

      // Assert
      expect(error.message).toBe(errorMessage);
      expect(error.statusCode).toBe(largeCode);
    });
  });
});
