import { describe, it, expect } from 'vitest';
import { locationTracker } from '../locationTrackingService';

describe('LocationTrackingService', () => {
  it('deve calcular distância entre dois pontos corretamente', () => {
    // São Paulo: -23.5505, -46.6333
    // Rio de Janeiro: -22.9068, -43.1729
    // Distância real ~= 357km
    
    const distance = (locationTracker as any).calculateDistance(
      -23.5505, -46.6333,
      -22.9068, -43.1729
    );

    expect(distance).toBeGreaterThan(350000); // > 350km em metros
    expect(distance).toBeLessThan(370000);    // < 370km em metros
  });

  it('deve retornar 0 para pontos idênticos', () => {
    const distance = (locationTracker as any).calculateDistance(
      -23.5505, -46.6333,
      -23.5505, -46.6333
    );

    expect(distance).toBe(0);
  });

  it('deve calcular distância para pontos próximos (1km)', () => {
    // Pontos separados por aproximadamente 1km
    const distance = (locationTracker as any).calculateDistance(
      -23.5505, -46.6333,
      -23.5595, -46.6333
    );

    expect(distance).toBeGreaterThan(900);  // > 900m
    expect(distance).toBeLessThan(1100);    // < 1100m
  });
});
