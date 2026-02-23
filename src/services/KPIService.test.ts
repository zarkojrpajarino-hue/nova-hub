import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KPIService } from './KPIService';

// Mock the repository
vi.mock('@/repositories/KPIRepository', () => ({
  kpiRepository: {
    findById: vi.fn(),
    findByOwner: vi.fn(),
    findByTypeAndOwner: vi.fn(),
    findPendingForValidation: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addValidation: vi.fn(),
    getValidationCount: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

import { kpiRepository } from '@/repositories/KPIRepository';

const mockRepo = vi.mocked(kpiRepository);

describe('KPIService', () => {
  let service: KPIService;

  beforeEach(() => {
    service = new KPIService();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('throws if titulo is missing', async () => {
      await expect(
        service.create({ titulo: '', type: 'lp', owner_id: 'user1' })
      ).rejects.toThrow('Título, tipo y propietario son requeridos');
    });

    it('throws if type is missing', async () => {
      await expect(
        service.create({ titulo: 'Test KPI', type: undefined as never, owner_id: 'user1' })
      ).rejects.toThrow('Título, tipo y propietario son requeridos');
    });

    it('throws if owner_id is missing', async () => {
      await expect(
        service.create({ titulo: 'Test KPI', type: 'lp', owner_id: '' })
      ).rejects.toThrow('Título, tipo y propietario son requeridos');
    });

    it('throws for invalid evidence_url', async () => {
      await expect(
        service.create({ titulo: 'Test KPI', type: 'lp', owner_id: 'user1', evidence_url: 'not-a-url' })
      ).rejects.toThrow('URL de evidencia inválida');
    });

    it('accepts valid evidence_url', async () => {
      mockRepo.create.mockResolvedValue({ id: 'kpi1', titulo: 'Test', type: 'lp', owner_id: 'user1' } as never);
      await service.create({ titulo: 'Test KPI', type: 'lp', owner_id: 'user1', evidence_url: 'https://example.com/evidence' });
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('sets default status to pending when not provided', async () => {
      mockRepo.create.mockResolvedValue({ id: 'kpi1' } as never);
      const data = { titulo: 'Test KPI', type: 'bp' as const, owner_id: 'user1' };
      await service.create(data);
      expect(data.status).toBe('pending');
    });

    it('preserves status when explicitly provided', async () => {
      mockRepo.create.mockResolvedValue({ id: 'kpi1' } as never);
      const data = { titulo: 'Test KPI', type: 'cp' as const, owner_id: 'user1', status: 'validated' as const };
      await service.create(data);
      expect(data.status).toBe('validated');
    });

    it('delegates to repository on valid data', async () => {
      const mockKPI = { id: 'kpi1', titulo: 'Test', type: 'lp', owner_id: 'user1' };
      mockRepo.create.mockResolvedValue(mockKPI as never);
      const result = await service.create({ titulo: 'Test', type: 'lp', owner_id: 'user1' });
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockKPI);
    });
  });

  describe('validate', () => {
    it('adds validation and checks counts', async () => {
      mockRepo.addValidation.mockResolvedValue(undefined);
      mockRepo.getValidationCount.mockResolvedValue({ approved: 1, rejected: 0 });
      await service.validate('kpi1', 'validator1', true);
      expect(mockRepo.addValidation).toHaveBeenCalledWith('kpi1', 'validator1', true, undefined);
      expect(mockRepo.getValidationCount).toHaveBeenCalledWith('kpi1');
      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });

    it('auto-approves after 2 approvals', async () => {
      mockRepo.addValidation.mockResolvedValue(undefined);
      mockRepo.getValidationCount.mockResolvedValue({ approved: 2, rejected: 0 });
      await service.validate('kpi1', 'validator1', true);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('kpi1', 'validated');
    });

    it('auto-rejects after 2 rejections', async () => {
      mockRepo.addValidation.mockResolvedValue(undefined);
      mockRepo.getValidationCount.mockResolvedValue({ approved: 0, rejected: 2 });
      await service.validate('kpi1', 'validator1', false);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('kpi1', 'rejected');
    });

    it('passes comment to addValidation', async () => {
      mockRepo.addValidation.mockResolvedValue(undefined);
      mockRepo.getValidationCount.mockResolvedValue({ approved: 0, rejected: 0 });
      await service.validate('kpi1', 'validator1', true, 'Looks good');
      expect(mockRepo.addValidation).toHaveBeenCalledWith('kpi1', 'validator1', true, 'Looks good');
    });
  });

  describe('calculatePoints', () => {
    it('returns custom points when provided', () => {
      expect(service.calculatePoints('lp', 5)).toBe(5);
    });

    it('returns 1 for lp type by default', () => {
      expect(service.calculatePoints('lp')).toBe(1);
    });

    it('returns 1 for bp type by default', () => {
      expect(service.calculatePoints('bp')).toBe(1);
    });

    it('returns 1 for cp type by default', () => {
      expect(service.calculatePoints('cp')).toBe(1);
    });
  });

  describe('delegation methods', () => {
    it('getById delegates to repository', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'kpi1' } as never);
      await service.getById('kpi1');
      expect(mockRepo.findById).toHaveBeenCalledWith('kpi1');
    });

    it('getByOwner delegates to repository', async () => {
      mockRepo.findByOwner.mockResolvedValue([]);
      await service.getByOwner('user1');
      expect(mockRepo.findByOwner).toHaveBeenCalledWith('user1');
    });

    it('delete delegates to repository', async () => {
      mockRepo.delete.mockResolvedValue(undefined);
      await service.delete('kpi1');
      expect(mockRepo.delete).toHaveBeenCalledWith('kpi1');
    });
  });
});
