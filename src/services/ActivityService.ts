import { activityRepository } from '@/repositories/ActivityRepository';

export class ActivityService {
  /**
   * Get recent activity logs
   */
  async getRecent(limit = 10) {
    return activityRepository.getRecent(limit);
  }

  /**
   * Get activity logs for a specific user
   */
  async getByUser(userId: string, limit = 20) {
    return activityRepository.getByUser(userId, limit);
  }

  /**
   * Get activity logs for a specific project
   */
  async getByProject(projectId: string, limit = 20) {
    return activityRepository.getByProject(projectId, limit);
  }
}

export const activityService = new ActivityService();
