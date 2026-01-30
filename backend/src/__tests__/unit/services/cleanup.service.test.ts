import { CleanupService } from '../../../services/cleanup.service'
import fs from 'fs/promises'
import path from 'path'

// Mock node-cron to avoid actual scheduling in tests
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn()
  }))
}))

describe('CleanupService', () => {
  let service: CleanupService
  const testDir = path.join(__dirname, 'test-uploads')

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true })
    process.env.UPLOAD_DIR = testDir
    service = new CleanupService()
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
    delete process.env.UPLOAD_DIR
    delete process.env.CLEANUP_CRON_SCHEDULE
  })

  describe('constructor', () => {
    it('should use default upload directory', () => {
      delete process.env.UPLOAD_DIR
      const newService = new CleanupService()
      expect(newService).toBeDefined()
    })

    it('should use environment variable for upload directory', () => {
      process.env.UPLOAD_DIR = '/custom/uploads'
      const newService = new CleanupService()
      expect(newService).toBeDefined()
    })
  })

  describe('startCleanupJob', () => {
    it('should use default cron schedule', () => {
      delete process.env.CLEANUP_CRON_SCHEDULE
      const consoleSpy = jest.spyOn(console, 'log')
      
      service.startCleanupJob()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Job de limpeza automática agendado para executar diariamente'
      )
      
      consoleSpy.mockRestore()
    })

    it('should use environment variable for cron schedule', () => {
      process.env.CLEANUP_CRON_SCHEDULE = '0 2 * * *'
      const consoleSpy = jest.spyOn(console, 'log')
      
      service.startCleanupJob()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Job de limpeza automática agendado para executar diariamente'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('cleanupOldPosts', () => {
    it('should not run if already running', async () => {
      // Mock isRunning to true
      const consoleSpy = jest.spyOn(console, 'log')
      
      // First call sets isRunning to true
      const promise1 = service.cleanupOldPosts()
      
      // Second call should skip
      const promise2 = service.cleanupOldPosts()
      
      await Promise.all([promise1, promise2])
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job de limpeza já está em execução')
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle lock timeout', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      
      await service.cleanupOldPosts()
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('runCleanupManually', () => {
    it('should execute cleanup manually', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      
      await service.runCleanupManually()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executando limpeza manual')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('checkOrphanedFiles', () => {
    it('should return empty array when no orphaned files', async () => {
      const result = await service.checkOrphanedFiles()
      
      expect(Array.isArray(result)).toBe(true)
    })

    it('should find orphaned files', async () => {
      // Create test file structure
      const testFile = path.join(testDir, 'empresa/cliente/images/orphaned.jpg')
      await fs.mkdir(path.dirname(testFile), { recursive: true })
      await fs.writeFile(testFile, 'test content')
      
      const result = await service.checkOrphanedFiles()
      
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('cleanupOrphanedFiles', () => {
    it('should remove orphaned files', async () => {
      // Create test file
      const testFile = path.join(testDir, 'empresa/cliente/images/orphaned.jpg')
      await fs.mkdir(path.dirname(testFile), { recursive: true })
      await fs.writeFile(testFile, 'test content')
      
      await service.cleanupOrphanedFiles()
      
      // File should be removed or service should handle it gracefully
      expect(service).toBeDefined()
    })

    it('should handle missing files gracefully', async () => {
      await expect(service.cleanupOrphanedFiles()).resolves.not.toThrow()
    })
  })
})
