import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OBVService } from './OBVService';

// Mock repositories
vi.mock('@/repositories/OBVRepository', () => ({
  obvRepository: {
    findById: vi.fn(),
    findByProject: vi.fn(),
    findByCreator: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addParticipants: vi.fn(),
    getParticipants: vi.fn(),
  },
}));

vi.mock('@/repositories/LeadRepository', () => ({
  leadRepository: {
    create: vi.fn(),
  },
}));

import { obvRepository } from '@/repositories/OBVRepository';
import { leadRepository } from '@/repositories/LeadRepository';

const mockObvRepo = vi.mocked(obvRepository);
const mockLeadRepo = vi.mocked(leadRepository);

const baseOBVData = {
  titulo: 'Test OBV',
  project_id: 'proj1',
  creator_id: 'user1',
};

describe('OBVService', () => {
  let service: OBVService;

  beforeEach(() => {
    service = new OBVService();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('throws if titulo is missing', async () => {
      await expect(
        service.create({ titulo: '', project_id: 'proj1' })
      ).rejects.toThrow('Título y proyecto son requeridos');
    });

    it('throws if project_id is missing', async () => {
      await expect(
        service.create({ titulo: 'Test OBV', project_id: '' })
      ).rejects.toThrow('Título y proyecto son requeridos');
    });

    it('delegates to repository on valid data', async () => {
      const mockOBV = { id: 'obv1', ...baseOBVData };
      mockObvRepo.create.mockResolvedValue(mockOBV as never);
      const result = await service.create(baseOBVData);
      expect(mockObvRepo.create).toHaveBeenCalledWith(baseOBVData);
      expect(result).toEqual(mockOBV);
    });
  });

  describe('createWithLead', () => {
    it('creates OBV without lead when leadData is not provided', async () => {
      const mockOBV = { id: 'obv1', ...baseOBVData };
      mockObvRepo.create.mockResolvedValue(mockOBV as never);
      const result = await service.createWithLead(baseOBVData);
      expect(mockLeadRepo.create).not.toHaveBeenCalled();
      expect(mockObvRepo.create).toHaveBeenCalledWith({ ...baseOBVData, lead_id: undefined });
      expect(result).toEqual({ obv: mockOBV, leadId: undefined });
    });

    it('creates lead and links it to OBV when leadData is provided', async () => {
      const mockLead = { id: 'lead1', nombre: 'Test Lead', project_id: 'proj1' };
      const mockOBV = { id: 'obv1', ...baseOBVData, lead_id: 'lead1' };
      mockLeadRepo.create.mockResolvedValue(mockLead as never);
      mockObvRepo.create.mockResolvedValue(mockOBV as never);

      const result = await service.createWithLead(baseOBVData, { nombre: 'Test Lead', project_id: 'proj1' });

      expect(mockLeadRepo.create).toHaveBeenCalledWith({ nombre: 'Test Lead', project_id: 'proj1' });
      expect(mockObvRepo.create).toHaveBeenCalledWith({ ...baseOBVData, lead_id: 'lead1' });
      expect(result.leadId).toBe('lead1');
      expect(result.obv).toEqual(mockOBV);
    });
  });

  describe('createWithParticipants', () => {
    it('creates OBV and adds participants', async () => {
      const mockOBV = { id: 'obv1', ...baseOBVData };
      mockObvRepo.create.mockResolvedValue(mockOBV as never);
      mockObvRepo.addParticipants.mockResolvedValue(undefined);

      const participants = [
        { user_id: 'user1', porcentaje_participacion: 60, facturacion: 1000, margen: 500 },
        { user_id: 'user2', porcentaje_participacion: 40 },
      ];

      const result = await service.createWithParticipants(baseOBVData, participants);

      expect(mockObvRepo.create).toHaveBeenCalledWith(baseOBVData);
      expect(mockObvRepo.addParticipants).toHaveBeenCalledWith([
        { obv_id: 'obv1', user_id: 'user1', porcentaje_participacion: 60, facturacion: 1000, margen: 500 },
        { obv_id: 'obv1', user_id: 'user2', porcentaje_participacion: 40, facturacion: 0, margen: 0 },
      ]);
      expect(result).toEqual(mockOBV);
    });

    it('defaults facturacion and margen to 0 when not provided', async () => {
      const mockOBV = { id: 'obv1', ...baseOBVData };
      mockObvRepo.create.mockResolvedValue(mockOBV as never);
      mockObvRepo.addParticipants.mockResolvedValue(undefined);

      await service.createWithParticipants(baseOBVData, [
        { user_id: 'user1', porcentaje_participacion: 100 },
      ]);

      expect(mockObvRepo.addParticipants).toHaveBeenCalledWith([
        { obv_id: 'obv1', user_id: 'user1', porcentaje_participacion: 100, facturacion: 0, margen: 0 },
      ]);
    });
  });

  describe('delegation methods', () => {
    it('getById delegates to repository', async () => {
      mockObvRepo.findById.mockResolvedValue({ id: 'obv1' } as never);
      await service.getById('obv1');
      expect(mockObvRepo.findById).toHaveBeenCalledWith('obv1');
    });

    it('getByProject delegates to repository', async () => {
      mockObvRepo.findByProject.mockResolvedValue([]);
      await service.getByProject('proj1');
      expect(mockObvRepo.findByProject).toHaveBeenCalledWith('proj1');
    });

    it('update delegates to repository', async () => {
      mockObvRepo.update.mockResolvedValue({ id: 'obv1' } as never);
      await service.update('obv1', { titulo: 'Updated' });
      expect(mockObvRepo.update).toHaveBeenCalledWith('obv1', { titulo: 'Updated' });
    });

    it('delete delegates to repository', async () => {
      mockObvRepo.delete.mockResolvedValue(undefined);
      await service.delete('obv1');
      expect(mockObvRepo.delete).toHaveBeenCalledWith('obv1');
    });

    it('getParticipants delegates to repository', async () => {
      mockObvRepo.getParticipants.mockResolvedValue([]);
      await service.getParticipants('obv1');
      expect(mockObvRepo.getParticipants).toHaveBeenCalledWith('obv1');
    });
  });
});
