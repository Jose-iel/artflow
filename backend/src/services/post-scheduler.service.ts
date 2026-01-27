import { AppDataSource } from '../config/data-source';
import { Post, PostStatus } from '../entities/Post';
import { LessThan } from 'typeorm';

export class PostSchedulerService {
  private get postRepository() {
    return AppDataSource.getRepository(Post);
  }

  /**
   * Atualiza posts aprovados com data agendada no passado para Publicado
   * Executa automaticamente via cron job
   */
  async publishScheduledPosts(): Promise<number> {
    try {
      const now = new Date();
      
      const postsToPublish = await this.postRepository.find({
        where: {
          status: PostStatus.APROVADO,
          dataAgendada: LessThan(now)
        },
        relations: ['cliente', 'squad']
      });

      if (postsToPublish.length === 0) {
        console.log('[PostScheduler] Nenhum post para publicar');
        return 0;
      }

      console.log(`[PostScheduler] Encontrados ${postsToPublish.length} posts para publicar`);

      let publishedCount = 0;
      for (const post of postsToPublish) {
        try {
          post.status = PostStatus.PUBLICADO;
          post.dataAgendada = null;
          await this.postRepository.save(post);
          
          console.log(`[PostScheduler] ✓ Post ${post.id} publicado (Cliente: ${post.cliente.nome})`);
          publishedCount++;
        } catch (error) {
          console.error(`[PostScheduler] ✗ Erro ao publicar post ${post.id}:`, error);
        }
      }

      console.log(`[PostScheduler] Total publicado: ${publishedCount}/${postsToPublish.length}`);
      return publishedCount;
    } catch (error) {
      console.error('[PostScheduler] Erro ao buscar posts agendados:', error);
      throw error;
    }
  }
}
