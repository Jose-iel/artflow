import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para validação de DTOs usando class-validator
 * Transforma o body em instância do DTO e executa validações
 */
export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(dtoClass, req.body);
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => Object.values(error.constraints || {}))
        .flat();
      
      return res.status(400).json({
        status: 'error',
        message: 'Dados inválidos',
        errors: errorMessages
      });
    }
    
    req.body = dto;
    next();
  };
};
