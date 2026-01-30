import fs from 'fs/promises'
import path from 'path'
import AppError from '../utils/AppError'

export class FileValidatorService {
  private readonly maxFileSize: number
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  private readonly allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']

  constructor() {
    this.maxFileSize = (parseInt(process.env.MAX_FILE_SIZE || '500')) * 1024 * 1024 // 500MB
  }

  /**
   * Sanitiza componente de path removendo caracteres perigosos
   */
  sanitizePathComponent(input: string, defaultValue: string = 'default'): string {
    if (!input) return defaultValue
    
    // Remove caracteres perigosos: . / \ : * ? " < > |
    const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '_')
    
    // Limita tamanho
    return sanitized.substring(0, 255)
  }

  /**
   * Valida que o path final está dentro do diretório de upload
   */
  validatePath(finalPath: string, uploadDir: string): void {
    const resolvedFinalPath = path.resolve(finalPath)
    const resolvedUploadDir = path.resolve(uploadDir)

    if (!resolvedFinalPath.startsWith(resolvedUploadDir)) {
      throw new AppError('Caminho de arquivo inválido', 400)
    }
  }

  /**
   * Valida tamanho do arquivo
   */
  async validateFileSize(filePath: string): Promise<void> {
    const stats = await fs.stat(filePath)

    if (stats.size === 0) {
      await fs.unlink(filePath)
      throw new AppError('Arquivo vazio', 400)
    }

    if (stats.size > this.maxFileSize) {
      await fs.unlink(filePath)
      throw new AppError(
        `Arquivo excede tamanho máximo de ${this.maxFileSize / (1024 * 1024)}MB`,
        400
      )
    }
  }

  /**
   * Valida tipo de arquivo através de magic bytes
   */
  async validateFileType(filePath: string, declaredMimeType: string): Promise<void> {
    const buffer = await fs.readFile(filePath)
    const actualType = this.detectFileType(buffer)

    const allowedTypes = [...this.allowedImageTypes, ...this.allowedVideoTypes]

    if (!actualType || !allowedTypes.includes(actualType)) {
      await fs.unlink(filePath)
      throw new AppError('Tipo de arquivo não permitido', 400)
    }

    // Verificar se o tipo declarado corresponde ao tipo real
    const typeCategory = actualType.split('/')[0] // 'image' ou 'video'
    const declaredCategory = declaredMimeType.split('/')[0]

    if (typeCategory !== declaredCategory) {
      await fs.unlink(filePath)
      throw new AppError('Tipo de arquivo não corresponde ao declarado', 400)
    }
  }

  /**
   * Detecta tipo de arquivo através de magic bytes
   */
  private detectFileType(buffer: Buffer): string | null {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg'
    }

    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    ) {
      return 'image/png'
    }

    // GIF: 47 49 46 38
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return 'image/gif'
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp'
    }

    // MP4: 00 00 00 [size] 66 74 79 70
    if (
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
      return 'video/mp4'
    }

    // QuickTime/MOV: similar to MP4
    if (
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
      // Check for 'qt  ' or 'mov '
      const subtype = buffer.toString('ascii', 8, 12)
      if (subtype.includes('qt') || subtype.includes('mov')) {
        return 'video/quicktime'
      }
    }

    // AVI: 52 49 46 46 ... 41 56 49 20
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x41 &&
      buffer[9] === 0x56 &&
      buffer[10] === 0x49 &&
      buffer[11] === 0x20
    ) {
      return 'video/x-msvideo'
    }

    // WebM: 1A 45 DF A3
    if (
      buffer[0] === 0x1A &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xDF &&
      buffer[3] === 0xA3
    ) {
      return 'video/webm'
    }

    return null
  }
}
