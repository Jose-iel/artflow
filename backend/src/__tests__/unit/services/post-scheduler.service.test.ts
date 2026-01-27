import { PostSchedulerService } from '../../../services/post-scheduler.service';
import { AppDataSource } from '../../../config/data-source';
import { Post, PostStatus } from '../../../entities/Post';
import { LessThan } from 'typeorm';

jest.mock('../../../config/data-source');

describe('PostSchedulerService', () => {
  let service: PostSchedulerService;
  let mockPostRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPostRepository = {
      find: jest.fn(),
      save: jest.fn()
    };

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockPostRepository);
    
    service = new PostSchedulerService();

    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('publishScheduledPosts', () => {
    it('should return 0 when no posts to publish', async () => {
      mockPostRepository.find.mockResolvedValue([]);

      const result = await service.publishScheduledPosts();

      expect(result).toBe(0);
      expect(mockPostRepository.find).toHaveBeenCalled();
      expect(mockPostRepository.save).not.toHaveBeenCalled();
    });

    it('should publish posts with past scheduled dates', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const postsToPublish = [
        {
          id: 'post-1',
          status: PostStatus.APROVADO,
          dataAgendada: pastDate,
          cliente: { nome: 'Cliente 1' },
          squad: { id: 'squad-1' }
        },
        {
          id: 'post-2',
          status: PostStatus.APROVADO,
          dataAgendada: pastDate,
          cliente: { nome: 'Cliente 2' },
          squad: { id: 'squad-1' }
        }
      ];

      mockPostRepository.find.mockResolvedValue(postsToPublish);
      mockPostRepository.save.mockImplementation((post: any) => Promise.resolve(post));

      const result = await service.publishScheduledPosts();

      expect(result).toBe(2);
      expect(mockPostRepository.find).toHaveBeenCalledWith({
        where: {
          status: PostStatus.APROVADO,
          dataAgendada: expect.any(Object)
        },
        relations: ['cliente', 'squad']
      });
      expect(mockPostRepository.save).toHaveBeenCalledTimes(2);
      
      const savedPost1 = mockPostRepository.save.mock.calls[0][0];
      expect(savedPost1.status).toBe(PostStatus.PUBLICADO);
      expect(savedPost1.dataAgendada).toBeNull();
    });

    it('should handle individual post errors gracefully', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const postsToPublish = [
        {
          id: 'post-1',
          status: PostStatus.APROVADO,
          dataAgendada: pastDate,
          cliente: { nome: 'Cliente 1' },
          squad: { id: 'squad-1' }
        },
        {
          id: 'post-2',
          status: PostStatus.APROVADO,
          dataAgendada: pastDate,
          cliente: { nome: 'Cliente 2' },
          squad: { id: 'squad-1' }
        }
      ];

      mockPostRepository.find.mockResolvedValue(postsToPublish);
      mockPostRepository.save
        .mockResolvedValueOnce(postsToPublish[0])
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.publishScheduledPosts();

      expect(result).toBe(1);
      expect(mockPostRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw error when database query fails', async () => {
      mockPostRepository.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.publishScheduledPosts()).rejects.toThrow('Database connection failed');
    });

    it('should only publish approved posts', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      
      mockPostRepository.find.mockResolvedValue([]);

      await service.publishScheduledPosts();

      expect(mockPostRepository.find).toHaveBeenCalledWith({
        where: {
          status: PostStatus.APROVADO,
          dataAgendada: expect.any(Object)
        },
        relations: ['cliente', 'squad']
      });
    });

    it('should set dataAgendada to null after publishing', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const post = {
        id: 'post-1',
        status: PostStatus.APROVADO,
        dataAgendada: pastDate,
        cliente: { nome: 'Cliente 1' },
        squad: { id: 'squad-1' }
      };

      mockPostRepository.find.mockResolvedValue([post]);
      mockPostRepository.save.mockResolvedValue(post);

      await service.publishScheduledPosts();

      const savedPost = mockPostRepository.save.mock.calls[0][0];
      expect(savedPost.dataAgendada).toBeNull();
      expect(savedPost.status).toBe(PostStatus.PUBLICADO);
    });
  });
});
