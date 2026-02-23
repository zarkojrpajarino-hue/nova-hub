import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityService } from './ActivityService';

// Mock the repository
vi.mock('@/repositories/ActivityRepository', () => ({
  activityRepository: {
    getRecent: vi.fn(),
    getByUser: vi.fn(),
    getByProject: vi.fn(),
  },
}));

import { activityRepository } from '@/repositories/ActivityRepository';

const mockRepo = vi.mocked(activityRepository);

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    service = new ActivityService();
    vi.clearAllMocks();
  });

  // getRecent
  describe('getRecent', () => {
    it('delegates to repository with default limit of 10', async () => {
      mockRepo.getRecent.mockResolvedValue([]);
      await service.getRecent();
      expect(mockRepo.getRecent).toHaveBeenCalledWith(10);
    });

    it('delegates to repository with custom limit', async () => {
      mockRepo.getRecent.mockResolvedValue([]);
      await service.getRecent(25);
      expect(mockRepo.getRecent).toHaveBeenCalledWith(25);
    });

    it('returns the repository result', async () => {
      const logs = [{ id: 'log1' }, { id: 'log2' }];
      mockRepo.getRecent.mockResolvedValue(logs as never);
      const result = await service.getRecent(2);
      expect(result).toEqual(logs);
    });

    it('returns empty array when no recent activity', async () => {
      mockRepo.getRecent.mockResolvedValue([]);
      const result = await service.getRecent();
      expect(result).toEqual([]);
    });

    it('calls repository exactly once', async () => {
      mockRepo.getRecent.mockResolvedValue([]);
      await service.getRecent();
      expect(mockRepo.getRecent).toHaveBeenCalledTimes(1);
    });
  });

  // getByUser
  describe('getByUser', () => {
    it('delegates to repository with userId and default limit of 20', async () => {
      mockRepo.getByUser.mockResolvedValue([]);
      await service.getByUser('user1');
      expect(mockRepo.getByUser).toHaveBeenCalledWith('user1', 20);
    });

    it('delegates to repository with custom limit', async () => {
      mockRepo.getByUser.mockResolvedValue([]);
      await service.getByUser('user1', 50);
      expect(mockRepo.getByUser).toHaveBeenCalledWith('user1', 50);
    });

    it('returns the repository result', async () => {
      const logs = [{ id: 'log1', user_id: 'user1' }];
      mockRepo.getByUser.mockResolvedValue(logs as never);
      const result = await service.getByUser('user1');
      expect(result).toEqual(logs);
    });

    it('returns empty array when user has no activity', async () => {
      mockRepo.getByUser.mockResolvedValue([]);
      const result = await service.getByUser('new-user');
      expect(result).toEqual([]);
    });

    it('calls repository exactly once', async () => {
      mockRepo.getByUser.mockResolvedValue([]);
      await service.getByUser('user1');
      expect(mockRepo.getByUser).toHaveBeenCalledTimes(1);
    });
  });

  // getByProject
  describe('getByProject', () => {
    it('delegates to repository with projectId and default limit of 20', async () => {
      mockRepo.getByProject.mockResolvedValue([]);
      await service.getByProject('proj1');
      expect(mockRepo.getByProject).toHaveBeenCalledWith('proj1', 20);
    });

    it('delegates to repository with custom limit', async () => {
      mockRepo.getByProject.mockResolvedValue([]);
      await service.getByProject('proj1', 100);
      expect(mockRepo.getByProject).toHaveBeenCalledWith('proj1', 100);
    });

    it('returns the repository result', async () => {
      const logs = [{ id: 'log1', project_id: 'proj1' }];
      mockRepo.getByProject.mockResolvedValue(logs as never);
      const result = await service.getByProject('proj1');
      expect(result).toEqual(logs);
    });

    it('returns empty array when project has no activity', async () => {
      mockRepo.getByProject.mockResolvedValue([]);
      const result = await service.getByProject('empty-proj');
      expect(result).toEqual([]);
    });

    it('calls repository exactly once', async () => {
      mockRepo.getByProject.mockResolvedValue([]);
      await service.getByProject('proj1');
      expect(mockRepo.getRecent).not.toHaveBeenCalled();
      expect(mockRepo.getByUser).not.toHaveBeenCalled();
    });
  });
});