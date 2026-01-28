import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { Cliente } from '../entities/Cliente';
import { CreateClienteDto, LoginDto, ClienteResponseDto, LoginResponseDto } from '../dtos/cliente.dto';
import AppError from '../utils/AppError';
import { QueryFailedError } from 'typeorm';

export class AuthController {
  private get clienteRepository() {
    return AppDataSource.getRepository(Cliente);
  }

  private mapClienteToResponse(cliente: Cliente): ClienteResponseDto {
    return {
      id: cliente.id,
      name: cliente.nome,
      email: cliente.email,
      active: cliente.ativo,
      role: 'CLIENT', // All clientes are now CLIENT type by default
      createdAt: cliente.criadoEm,
      updatedAt: cliente.atualizadoEm
    };
  }

  async register(req: Request, res: Response) {
    try {
      const { nome, email, senha, squadId }: CreateClienteDto & { squadId?: string } = req.body;

      // Validation
      if (!nome || !nome.trim()) {
        throw new AppError('Nome é obrigatório', 400);
      }

      if (!email || !email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        throw new AppError('email inválido', 400);
      }

      if (!senha || senha.length < 8) {
        throw new AppError('Senha deve ter pelo menos 8 caracteres', 400);
      }

      // Check if email already exists
      const existingCliente = await this.clienteRepository.findOne({ where: { email } });
      if (existingCliente) {
        throw new AppError('Email já cadastrado', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(senha, 8);

      // Create new cliente
      const newCliente = this.clienteRepository.create({
        nome: nome.trim(),
        email: email.toLowerCase(),
        senha: hashedPassword,
        squadId: squadId || null
      });

      const savedCliente = await this.clienteRepository.save(newCliente);

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret não configurado', 500);
      }

      const token = jwt.sign(
        { id: savedCliente.id, email: savedCliente.email, type: 'cliente' },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      const response: LoginResponseDto = {
        message: 'Cliente criado com sucesso',
        token,
        cliente: this.mapClienteToResponse(savedCliente)
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      // Handle database constraint violations
      if (error instanceof QueryFailedError && (error as any).code === '23505') {
        return res.status(400).json({
          status: 'error',
          message: 'Email já cadastrado'
        });
      }

      console.error('Register error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, senha }: LoginDto = req.body;

      // Validation - check required fields first
      if (!email) {
        throw new AppError('Email é obrigatório', 400);
      }

      if (!senha) {
        throw new AppError('Senha é obrigatória', 400);
      }

      // Then validate format
      if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        throw new AppError('email inválido', 400);
      }

      // Find cliente
      const cliente = await this.clienteRepository.findOne({ 
        where: { email: email.toLowerCase(), ativo: true } 
      });

      if (!cliente) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Check password
      const passwordMatch = await bcrypt.compare(senha, cliente.senha);
      if (!passwordMatch) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret não configurado', 500);
      }

      const token = jwt.sign(
        { id: cliente.id, email: cliente.email, type: 'cliente' },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      const response: LoginResponseDto = {
        message: 'Login realizado com sucesso',
        token,
        cliente: this.mapClienteToResponse(cliente)
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Login error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).cliente.id;
      const { nome, email } = req.body;

      if (!nome || !nome.trim()) {
        throw new AppError('Nome é obrigatório', 400);
      }

      const cliente = await this.clienteRepository.findOne({ where: { id: userId } });
      if (!cliente) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // For CLIENT role, only allow name changes (email remains unchanged)
      // All clientes are now CLIENT type by default
      cliente.nome = nome.trim();
      cliente.atualizadoEm = new Date();

      await this.clienteRepository.save(cliente);

      // Generate new JWT token with updated user data
      const token = jwt.sign(
        { 
          id: cliente.id, 
          email: cliente.email, 
          type: 'cliente' 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      const response = {
        message: 'Perfil atualizado com sucesso',
        cliente: this.mapClienteToResponse(cliente),
        token
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Update profile error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).cliente.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Senha atual e nova senha são obrigatórias', 400);
      }

      if (newPassword.length < 6) {
        throw new AppError('A nova senha deve ter pelo menos 6 caracteres', 400);
      }

      const cliente = await this.clienteRepository.findOne({ 
        where: { id: userId }
      });

      if (!cliente) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, cliente.senha);
      if (!isCurrentPasswordValid) {
        throw new AppError('Senha atual incorreta', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 8);

      cliente.senha = hashedNewPassword;
      cliente.atualizadoEm = new Date();

      await this.clienteRepository.save(cliente);

      const response = {
        message: 'Senha alterada com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }

      console.error('Change password error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor'
      });
    }
  }
}
