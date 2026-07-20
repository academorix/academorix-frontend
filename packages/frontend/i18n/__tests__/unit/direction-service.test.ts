import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectionService } from '@/core/services/direction.service';
import type { IDirectionAdapter } from '@/core/interfaces';

describe('DirectionService', () => {
  let service: DirectionService;

  beforeEach(() => {
    service = new DirectionService();
  });

  describe('detection (pure, no adapter needed)', () => {
    it('detects Arabic as RTL', () => {
      expect(service.isRtl('ar')).toBe(true);
      expect(service.getDirection('ar')).toBe('rtl');
    });

    it('detects Hebrew as RTL', () => {
      expect(service.isRtl('he')).toBe(true);
    });

    it('detects English as LTR', () => {
      expect(service.isRtl('en')).toBe(false);
      expect(service.getDirection('en')).toBe('ltr');
    });

    it('detects regional Arabic (ar-SA) as RTL', () => {
      expect(service.isRtl('ar-SA')).toBe(true);
    });

    it('detects French as LTR', () => {
      expect(service.isRtl('fr')).toBe(false);
    });
  });

  describe('application (delegates to adapter)', () => {
    it('calls adapter.apply with correct direction', () => {
      const mockAdapter: IDirectionAdapter = {
        apply: vi.fn().mockReturnValue(false),
        getCurrentDirection: vi.fn().mockReturnValue('ltr'),
      };
      const serviceWithAdapter = new DirectionService(mockAdapter);

      serviceWithAdapter.apply('ar');

      expect(mockAdapter.apply).toHaveBeenCalledWith('rtl', 'ar');
    });

    it('returns true when adapter signals restart needed', () => {
      const mockAdapter: IDirectionAdapter = {
        apply: vi.fn().mockReturnValue(true),
        getCurrentDirection: vi.fn().mockReturnValue('ltr'),
      };
      const serviceWithAdapter = new DirectionService(mockAdapter);

      expect(serviceWithAdapter.apply('ar')).toBe(true);
    });

    it('returns false when no direction change', () => {
      const mockAdapter: IDirectionAdapter = {
        apply: vi.fn().mockReturnValue(false),
        getCurrentDirection: vi.fn().mockReturnValue('ltr'),
      };
      const serviceWithAdapter = new DirectionService(mockAdapter);

      expect(serviceWithAdapter.apply('en')).toBe(false);
    });

    it('uses no-op adapter by default', () => {
      // No adapter set — should not throw
      expect(service.apply('ar')).toBe(false);
      expect(service.getCurrentDirection()).toBe('ltr');
    });
  });
});
