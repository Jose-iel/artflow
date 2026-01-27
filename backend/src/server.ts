import 'reflect-metadata';
import 'dotenv/config';
import { app } from './app';
import { AppDataSource } from './config/data-source';
import cron from 'node-cron';
import { PostSchedulerService } from './services/post-scheduler.service';

const startServer = async () => {
  const port = Number(process.env.PORT);
  const validPort = !isNaN(port) && port > 0 && port <= 65535 ? port : 3333;
  
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    app.listen(validPort, () => {
      console.log(`🚀 Server is running on port ${validPort}`);
    });

    const postScheduler = new PostSchedulerService();
    
    cron.schedule('0 0 * * *', async () => {
      console.log('[PostScheduler] Iniciando verificação de posts agendados...');
      try {
        const published = await postScheduler.publishScheduledPosts();
        if (published > 0) {
          console.log(`[PostScheduler] ✓ ${published} posts publicados com sucesso`);
        }
      } catch (error) {
        console.error('[PostScheduler] ✗ Erro na execução:', error);
      }
    });
    
    console.log('[PostScheduler] Job agendado configurado (executa todo dia à meia-noite)');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Only auto-start server if this file is run directly (not when imported in tests)
if (require.main === module) {
  startServer();
}

export { startServer };
