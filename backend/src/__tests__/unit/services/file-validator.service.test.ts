import { FileValidatorService } from '../../../services/file-validator.service'
import fs from 'fs/promises'
import path from 'path'
import AppError from '../../../utils/AppError'

describe('FileValidatorService', () => {
  let service: FileValidatorService
  const testDir = path.join(__dirname, 'test-uploads')
  const testFile = path.join(testDir, 'test-file.jpg')

  beforeEach(async () => {
    service = new FileValidatorService()
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('sanitizePathComponent', () => {
    it('should remove dangerous characters', () => {
      const result = service.sanitizePathComponent('../../../etc/passwd')
      expect(result).toBe('_________etc_passwd')
      expect(result).not.toContain('..')
      expect(result).not.toContain('/')
    })

    it('should allow alphanumeric and safe characters', () => {
      const result = service.sanitizePathComponent('abc123-xyz_')
      expect(result).toBe('abc123-xyz_')
    })

    it('should use default value for empty input', () => {
      const result = service.sanitizePathComponent('', 'default')
      expect(result).toBe('default')
    })

    it('should truncate long strings to 255 characters', () => {
      const longString = 'a'.repeat(300)
      const result = service.sanitizePathComponent(longString)
      expect(result.length).toBe(255)
    })
  })

  describe('validatePath', () => {
    it('should accept path inside upload directory', () => {
      const uploadDir = '/app/uploads'
      const filePath = '/app/uploads/empresa/cliente/images/file.jpg'
      
      expect(() => {
        service.validatePath(filePath, uploadDir)
      }).not.toThrow()
    })

    it('should reject path outside upload directory', () => {
      const uploadDir = '/app/uploads'
      const filePath = '/etc/passwd'
      
      expect(() => {
        service.validatePath(filePath, uploadDir)
      }).toThrow(AppError)
      expect(() => {
        service.validatePath(filePath, uploadDir)
      }).toThrow('Caminho de arquivo inválido')
    })

    it('should reject path traversal attempts', () => {
      const uploadDir = '/app/uploads'
      const filePath = '/app/uploads/../../../etc/passwd'
      
      expect(() => {
        service.validatePath(filePath, uploadDir)
      }).toThrow(AppError)
    })
  })

  describe('validateFileSize', () => {
    it('should accept file within size limit', async () => {
      // Create small test file (1KB)
      const content = Buffer.alloc(1024)
      await fs.writeFile(testFile, content)

      await expect(
        service.validateFileSize(testFile)
      ).resolves.not.toThrow()
    })

    it('should reject empty file', async () => {
      // Create empty file
      await fs.writeFile(testFile, Buffer.alloc(0))
      
      await expect(
        service.validateFileSize(testFile)
      ).rejects.toThrow(AppError)
    })

    it('should reject file exceeding size limit', async () => {
      // Create a test file first
      await fs.writeFile(testFile, Buffer.alloc(1024))
      
      // Mock file stats to simulate large file
      const mockStats = { size: 600 * 1024 * 1024 } // 600MB
      jest.spyOn(fs, 'stat').mockResolvedValue(mockStats as any)

      await expect(
        service.validateFileSize(testFile)
      ).rejects.toThrow(AppError)

      jest.restoreAllMocks()
    })
  })

  describe('validateFileType', () => {
    it('should accept valid JPEG file', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      await fs.writeFile(testFile, jpegHeader)

      await expect(
        service.validateFileType(testFile, 'image/jpeg')
      ).resolves.not.toThrow()
    })

    it('should accept valid PNG file', async () => {
      // PNG magic bytes: 89 50 4E 47
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
      await fs.writeFile(testFile, pngHeader)

      await expect(
        service.validateFileType(testFile, 'image/png')
      ).resolves.not.toThrow()
    })

    it('should reject file with wrong magic bytes', async () => {
      // Invalid magic bytes
      const invalidHeader = Buffer.from([0x00, 0x00, 0x00, 0x00])
      await fs.writeFile(testFile, invalidHeader)

      await expect(
        service.validateFileType(testFile, 'image/jpeg')
      ).rejects.toThrow(AppError)

      // File should be deleted after validation failure
      await expect(fs.access(testFile)).rejects.toThrow()
    })

    it('should reject text file pretending to be image', async () => {
      // Text file content
      const textContent = Buffer.from('This is a text file')
      await fs.writeFile(testFile, textContent)

      await expect(
        service.validateFileType(testFile, 'image/jpeg')
      ).rejects.toThrow('Tipo de arquivo não permitido')

      // File should be deleted
      await expect(fs.access(testFile)).rejects.toThrow()
    })

    it('should accept valid MP4 video', async () => {
      // MP4 magic bytes: 00 00 00 [size] 66 74 79 70
      const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])
      await fs.writeFile(testFile, mp4Header)

      await expect(
        service.validateFileType(testFile, 'video/mp4')
      ).resolves.not.toThrow()
    })
  })
})
