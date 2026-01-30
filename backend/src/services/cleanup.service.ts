import { AppDataSource } from '../config/data-source'
import { Post } from '../entities/Post'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

export class CleanupService {
  private uploadDir: string
  private isRunning: boolean = false

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads'
  }

  /**
   * Inicia o job de limpeza automática
   * Executa todo dia à meia-noite
   */
  startCleanupJob() {
    // Executa todo dia à meia-noite (00:00)
    cron.schedule('0 0 * * *', async () => {
      console.log('Iniciando job de limpeza automática...')
      await this.cleanupOldPosts()
    })

    // Também executa a cada 6 horas para testes
    cron.schedule('0 */6 * * *', async () => {
      console.log('Iniciando job de limpeza (verificação de 6 horas)...')
      await this.cleanupOldPosts()
    })

    console.log('Job de limpeza automática agendado para executar diariamente')
  }

  /**
   * Limpa posts e arquivos antigos
   * Remove posts com mais de 7 dias da data de agendamento
   */
  async cleanupOldPosts() {
    if (this.isRunning) {
      console.log('Job de limpeza já está em execução. Pulando...')
      return
    }

    this.isRunning = true
    console.log('Iniciando limpeza de posts antigos...')

    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      const postRepository = AppDataSource.getRepository(Post)

      // Calcula data de corte (7 dias atrás)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7)

      console.log(`Procurando posts anteriores a ${cutoffDate.toISOString()}`)

      // Busca posts antigos
      const oldPosts = await postRepository
        .createQueryBuilder('post')
        .where('post.dataAgendada < :cutoffDate', { cutoffDate })
        .orWhere('post.dataAgendada IS NULL AND post.criadoEm < :cutoffDate', { cutoffDate })
        .getMany()

      console.log(`Encontrados ${oldPosts.length} posts para limpar`)

      // Remove arquivos físicos
      for (const post of oldPosts) {
        if (post.imagePath) {
          try {
            const filePath = path.join(this.uploadDir, post.imagePath)
            await fs.unlink(filePath)
            console.log(`Arquivo removido: ${filePath}`)
          } catch (error) {
            console.error(`Erro ao remover arquivo ${post.imagePath}:`, error)
          }
        }
      }

      // Remove posts do banco
      const result = await postRepository.remove(oldPosts)
      console.log(`${result.length} posts removidos do banco de dados`)

    } catch (error) {
      console.error('Erro durante limpeza automática:', error)
    } finally {
      this.isRunning = false
      console.log('Job de limpeza finalizado')
    }
  }

  /**
   * Executa a limpeza manualmente (para testes)
   */
  async runCleanupManually() {
    console.log('Executando limpeza manualmente...')
    await this.cleanupOldPosts()
  }

  /**
   * Verifica se há arquivos órfãos (sem post correspondente)
   */
  async checkOrphanedFiles() {
    console.log('Verificando arquivos órfãos...')
    
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }

      const postRepository = AppDataSource.getRepository(Post)
      
      // Busca todos os paths de imagens no banco
      const posts = await postRepository.find({ select: { imagePath: true } })
      const usedPaths = new Set(posts.map((p: Post) => p.imagePath))

      // Lista todos os arquivos no diretório de uploads
      const allFiles = await this.getAllFiles(this.uploadDir)
      
      const orphanedFiles = allFiles.filter(file => !usedPaths.has(file))
      
      console.log(`Encontrados ${orphanedFiles.length} arquivos órfãos:`)
      orphanedFiles.forEach(file => console.log(`  - ${file}`))

      return orphanedFiles
    } catch (error) {
      console.error('Erro ao verificar arquivos órfãos:', error)
      return []
    }
  }

  /**
   * Remove arquivos órfãos
   */
  async cleanupOrphanedFiles() {
    const orphanedFiles = await this.checkOrphanedFiles()
    
    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(this.uploadDir, file)
        await fs.unlink(filePath)
        console.log(`Arquivo órfão removido: ${file}`)
      } catch (error) {
        console.error(`Erro ao remover arquivo órfão ${file}:`, error)
      }
    }
    
    console.log(`${orphanedFiles.length} arquivos órfãos removidos`)
  }

  /**
   * Lista recursivamente todos os arquivos no diretório
   */
  private async getAllFiles(dir: string, basePath: string = ''): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relativePath = path.join(basePath, entry.name)
        
        if (entry.isDirectory()) {
          files.push(...await this.getAllFiles(fullPath, relativePath))
        } else {
          files.push(relativePath)
        }
      }
    } catch (error) {
      console.error(`Erro ao ler diretório ${dir}:`, error)
    }
    
    return files
  }
}

// Exporta instância única
export const cleanupService = new CleanupService()
