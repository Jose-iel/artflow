const request = require('supertest');
import { Application } from 'express';
import jwt from 'jsonwebtoken';
import { app } from '../../app';

export const getApp = (): Application => {
  return app;
};

export const createTestUser = async () => {
  const appInstance = getApp();
  
  // Register a test user
  const registerResponse = await request(appInstance)
    .post('/api/auth/register')
    .send({
      nome: 'Test User',
      email: 'test@example.com',
      senha: 'senha123'
    });

  return {
    user: registerResponse.body.cliente,
    token: registerResponse.body.token
  };
};

export const authenticatedRequest = (token?: string) => {
  const requestApp = request(getApp());
  
  if (token) {
    requestApp.set('Authorization', `Bearer ${token}`);
  }
  
  return requestApp;
};

export const createAuthenticatedUser = async () => {
  return await createTestUser();
};

export const expectSuccessResponse = (response: any, expectedData?: any) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('status', 'success');
  
  if (expectedData) {
    expect(response.body.data).toMatchObject(expectedData);
  }
};

export const expectErrorResponse = (response: any, expectedStatus: number, expectedMessage?: string) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('status', 'error');
  
  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

export const testUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'test123456',
};

export const createTestUserInput = (overrides: any = {}) => ({
  ...testUserData,
  ...overrides,
});
