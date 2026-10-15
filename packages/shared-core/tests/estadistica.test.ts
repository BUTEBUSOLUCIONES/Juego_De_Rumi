import { describe, it, expect } from 'vitest';
import { actualizarEstadisticaSesion, EstadisticaSesionParticipante } from '../src/estadistica';

describe('actualizarEstadisticaSesion', () => {
  const estadisticaBase: EstadisticaSesionParticipante = {
    sesion_id: 's1',
    participante_id: 'p1',
    partidas_jugadas: 0,
    partidas_ganadas: 0,
    partidas_perdidas: 0,
    partidas_empatadas: 0,
    total_ganado: 0,
    total_perdido: 0,
    balance: 0
  };

  it('debe actualizar correctamente cuando el participante gana', () => {
    const actualizada = actualizarEstadisticaSesion(estadisticaBase, true, false, false, 0.25, 4);
    expect(actualizada.partidas_jugadas).toBe(1);
    expect(actualizada.partidas_ganadas).toBe(1);
    expect(actualizada.total_ganado).toBe(1.00);
    expect(actualizada.balance).toBe(0.75);
  });

  it('debe actualizar correctamente cuando el participante pierde', () => {
    const actualizada = actualizarEstadisticaSesion(estadisticaBase, false, true, false, 0.25, 4);
    expect(actualizada.partidas_jugadas).toBe(1);
    expect(actualizada.partidas_perdidas).toBe(1);
    expect(actualizada.total_perdido).toBe(0.25);
    expect(actualizada.balance).toBe(-0.25);
  });

  it('debe actualizar correctamente cuando hay empate', () => {
    const actualizada = actualizarEstadisticaSesion(estadisticaBase, false, false, true, 0.25, 4);
    expect(actualizada.partidas_jugadas).toBe(1);
    expect(actualizada.partidas_empatadas).toBe(1);
    expect(actualizada.balance).toBe(0);
  });
});