import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from './TaskService';

// Mock the repository
vi.mock('@/repositories/TaskRepository', () => ({
  taskRepository: {
    findById: vi.fn(),
    findByProject: vi.fn(),
    findByAssignee: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    completeWithFeedback: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock supabase client used directly in completeWithFeedback
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

import { taskRepository } from '@/repositories/TaskRepository';
import { supabase } from '@/integrations/supabase/client';

const mockRepo = vi.mocked(taskRepository);
const mockSupabase = vi.mocked(supabase);

const baseTask = {
  titulo: 'Investigate market',
  project_id: 'proj1',
};

const baseFeedback = {
  resultado: 'exito' as const,
  insights: 'The market is huge',
  aprendizaje: 'Validate early',
  siguiente_accion: 'Build MVP',
  dificultad: 3,
};

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
    vi.clearAllMocks();
    const insertMock = vi.fn(() => Promise.resolve({ error: null }));
    const fromMock = vi.fn(() => ({ insert: insertMock }));
    mockSupabase.from = fromMock as never;
  });

  // create
  describe('create', () => {
    it('throws if titulo is missing', async () => {
      await expect(
        service.create({ titulo: '', project_id: 'proj1' })
      ).rejects.toThrow();
    });

    it('throws if project_id is missing', async () => {
      await expect(
        service.create({ titulo: 'My task', project_id: '' })
      ).rejects.toThrow();
    });

    it('throws when both fields are missing', async () => {
      await expect(
        service.create({ titulo: '', project_id: '' })
      ).rejects.toThrow();
    });

    it('delegates to repository on valid data', async () => {
      const mockTask = { id: 'task1', ...baseTask };
      mockRepo.create.mockResolvedValue(mockTask as never);
      const result = await service.create(baseTask);
      expect(mockRepo.create).toHaveBeenCalledWith(baseTask);
      expect(result).toEqual(mockTask);
    });

    it('passes optional fields through to repository', async () => {
      const fullTask = { ...baseTask, assignee_id: 'user1', prioridad: 2 };
      mockRepo.create.mockResolvedValue({ id: 'task1', ...fullTask } as never);
      await service.create(fullTask);
      expect(mockRepo.create).toHaveBeenCalledWith(fullTask);
    });

    it('calls repository exactly once', async () => {
      mockRepo.create.mockResolvedValue({ id: 'task1', ...baseTask } as never);
      await service.create(baseTask);
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  // updateStatus
  describe('updateStatus', () => {
    it('delegates updateStatus to repository', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      await service.updateStatus('task1', 'in_progress');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('task1', 'in_progress');
    });

    it('passes done status to repository', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      await service.updateStatus('task1', 'done');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('task1', 'done');
    });

    it('passes todo status to repository', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      await service.updateStatus('task1', 'todo');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('task1', 'todo');
    });
  });

  // completeWithFeedback
  describe('completeWithFeedback', () => {
    it('inserts a user_insight record via supabase', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      await service.completeWithFeedback('task1', baseFeedback, 'user1', 'proj1', 'My Task');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_insights');
    });

    it('builds insight content containing all feedback fields', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      const insertMock = vi.fn(() => Promise.resolve({ error: null }));
      mockSupabase.from = vi.fn(() => ({ insert: insertMock })) as never;
      await service.completeWithFeedback('task1', baseFeedback, 'user1', 'proj1', 'My Task');
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.user_id).toBe('user1');
      expect(insertArg.project_id).toBe('proj1');
      expect(insertArg.tipo).toBe('tarea_completada');
      expect(insertArg.titulo).toBe('Tarea: My Task');
      expect(String(insertArg.contenido)).toContain('exito');
      expect(String(insertArg.contenido)).toContain('The market is huge');
      expect(String(insertArg.contenido)).toContain('Validate early');
      expect(String(insertArg.contenido)).toContain('Build MVP');
      expect(String(insertArg.contenido)).toContain('3/5');
    });

    it('includes tarea and resultado tags in the insight', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      const insertMock = vi.fn(() => Promise.resolve({ error: null }));
      mockSupabase.from = vi.fn(() => ({ insert: insertMock })) as never;
      await service.completeWithFeedback('task1', baseFeedback, 'user1', 'proj1', 'My Task');
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.tags).toEqual(['tarea', 'exito']);
    });

    it('delegates to taskRepository.completeWithFeedback', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      await service.completeWithFeedback('task1', baseFeedback, 'user1', 'proj1', 'My Task');
      expect(mockRepo.completeWithFeedback).toHaveBeenCalledWith(
        'task1', baseFeedback, undefined
      );
    });

    it('forwards currentMetadata to taskRepository', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      const meta = { someKey: 'someValue' };
      await service.completeWithFeedback('task1', baseFeedback, 'user1', 'proj1', 'My Task', meta as never);
      expect(mockRepo.completeWithFeedback).toHaveBeenCalledWith(
        'task1', baseFeedback, meta
      );
    });

    it('uses fallido tag when resultado is fallido', async () => {
      mockRepo.completeWithFeedback.mockResolvedValue(undefined);
      const insertMock = vi.fn(() => Promise.resolve({ error: null }));
      mockSupabase.from = vi.fn(() => ({ insert: insertMock })) as never;
      const failFeedback = { ...baseFeedback, resultado: 'fallido' as const };
      await service.completeWithFeedback('task1', failFeedback, 'user1', 'proj1', 'My Task');
      const insertArg = insertMock.mock.calls[0][0] as Record<string, unknown>;
      expect(insertArg.tags).toEqual(['tarea', 'fallido']);
    });
  });

  // delegation methods
  describe('delegation methods', () => {
    it('getById delegates to repository', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'task1' } as never);
      const result = await service.getById('task1');
      expect(mockRepo.findById).toHaveBeenCalledWith('task1');
      expect(result).toEqual({ id: 'task1' });
    });

    it('getByProject delegates to repository', async () => {
      mockRepo.findByProject.mockResolvedValue([]);
      await service.getByProject('proj1');
      expect(mockRepo.findByProject).toHaveBeenCalledWith('proj1');
    });

    it('getByAssignee delegates to repository', async () => {
      mockRepo.findByAssignee.mockResolvedValue([]);
      await service.getByAssignee('user1');
      expect(mockRepo.findByAssignee).toHaveBeenCalledWith('user1');
    });

    it('update delegates to repository with id and updates', async () => {
      const updated = { id: 'task1', titulo: 'Updated' };
      mockRepo.update.mockResolvedValue(updated as never);
      const result = await service.update('task1', { titulo: 'Updated' });
      expect(mockRepo.update).toHaveBeenCalledWith('task1', { titulo: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('delete delegates to repository', async () => {
      mockRepo.delete.mockResolvedValue(undefined);
      await service.delete('task1');
      expect(mockRepo.delete).toHaveBeenCalledWith('task1');
    });
  });
});