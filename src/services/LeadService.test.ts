import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from './LeadService';

// Mock the repository
vi.mock('@/repositories/LeadRepository', () => ({
  leadRepository: {
    findById: vi.fn(),
    findByProject: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    recordStatusChange: vi.fn(),
    delete: vi.fn(),
  },
}));

import { leadRepository } from '@/repositories/LeadRepository';

const mockRepo = vi.mocked(leadRepository);

const baseLead = {
  nombre: 'Acme Corp',
  project_id: 'proj1',
};

describe('LeadService', () => {
  let service: LeadService;

  beforeEach(() => {
    service = new LeadService();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('throws if nombre is missing', async () => {
      await expect(
        service.create({ nombre: '', project_id: 'proj1' })
      ).rejects.toThrow('Nombre y proyecto son requeridos');
    });

    it('throws if project_id is missing', async () => {
      await expect(
        service.create({ nombre: 'Acme Corp', project_id: '' })
      ).rejects.toThrow('Nombre y proyecto son requeridos');
    });

    it('throws when both nombre and project_id are missing', async () => {
      await expect(
        service.create({ nombre: '', project_id: '' })
      ).rejects.toThrow('Nombre y proyecto son requeridos');
    });

    it('delegates to repository on valid data', async () => {
      const mockLead = { id: 'lead1', ...baseLead };
      mockRepo.create.mockResolvedValue(mockLead as never);

      const result = await service.create(baseLead);

      expect(mockRepo.create).toHaveBeenCalledWith(baseLead);
      expect(result).toEqual(mockLead);
    });

    it('passes all optional fields through to repository', async () => {
      const fullLead = {
        ...baseLead,
        email: 'contact@acme.com',
        telefono: '+1-555-0100',
        status: 'frio' as const,
      };
      const mockLead = { id: 'lead1', ...fullLead };
      mockRepo.create.mockResolvedValue(mockLead as never);

      await service.create(fullLead);

      expect(mockRepo.create).toHaveBeenCalledWith(fullLead);
    });

    it('calls repository exactly once', async () => {
      mockRepo.create.mockResolvedValue({ id: 'lead1', ...baseLead } as never);
      await service.create(baseLead);
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // updateStatus
  // ---------------------------------------------------------------------------
  describe('updateStatus', () => {
    it('calls updateStatus on repository', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      mockRepo.recordStatusChange.mockResolvedValue(undefined);

      await service.updateStatus('lead1', 'tibio', 'frio', 'user1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('lead1', 'tibio');
    });

    it('records the status change in history', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      mockRepo.recordStatusChange.mockResolvedValue(undefined);

      await service.updateStatus('lead1', 'tibio', 'frio', 'user1');

      expect(mockRepo.recordStatusChange).toHaveBeenCalledWith(
        'lead1',
        'frio',
        'tibio',
        'user1'
      );
    });

    it('calls both repository methods in order', async () => {
      const calls: string[] = [];
      mockRepo.updateStatus.mockImplementation(async () => { calls.push('updateStatus'); });
      mockRepo.recordStatusChange.mockImplementation(async () => { calls.push('recordStatusChange'); });

      await service.updateStatus('lead1', 'caliente', 'tibio', 'user2');

      expect(calls).toEqual(['updateStatus', 'recordStatusChange']);
    });

    it('forwards all status transition values correctly', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);
      mockRepo.recordStatusChange.mockResolvedValue(undefined);

      await service.updateStatus('lead99', 'cerrado_ganado', 'caliente', 'admin');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('lead99', 'cerrado_ganado');
      expect(mockRepo.recordStatusChange).toHaveBeenCalledWith(
        'lead99',
        'caliente',
        'cerrado_ganado',
        'admin'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // delegation methods
  // ---------------------------------------------------------------------------
  describe('delegation methods', () => {
    it('getById delegates to repository', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'lead1' } as never);
      const result = await service.getById('lead1');
      expect(mockRepo.findById).toHaveBeenCalledWith('lead1');
      expect(result).toEqual({ id: 'lead1' });
    });

    it('getByProject delegates to repository', async () => {
      mockRepo.findByProject.mockResolvedValue([]);
      await service.getByProject('proj1');
      expect(mockRepo.findByProject).toHaveBeenCalledWith('proj1');
    });

    it('getByProject returns the repository result', async () => {
      const leads = [{ id: 'lead1' }, { id: 'lead2' }];
      mockRepo.findByProject.mockResolvedValue(leads as never);
      const result = await service.getByProject('proj1');
      expect(result).toEqual(leads);
    });

    it('getAll delegates to repository', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.getAll();
      expect(mockRepo.findAll).toHaveBeenCalledWith();
    });

    it('update delegates to repository with id and updates', async () => {
      const updated = { id: 'lead1', nombre: 'Updated Corp' };
      mockRepo.update.mockResolvedValue(updated as never);
      const result = await service.update('lead1', { nombre: 'Updated Corp' });
      expect(mockRepo.update).toHaveBeenCalledWith('lead1', { nombre: 'Updated Corp' });
      expect(result).toEqual(updated);
    });

    it('delete delegates to repository', async () => {
      mockRepo.delete.mockResolvedValue(undefined);
      await service.delete('lead1');
      expect(mockRepo.delete).toHaveBeenCalledWith('lead1');
    });
  });
});
