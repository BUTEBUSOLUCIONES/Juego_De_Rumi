import { describe, it, expect } from 'vitest';
import { GestorSesion } from '../src/gestor-sesion';
import { Sesion } from '../src/sesion';
import { EstadisticaSesionParticipante } from '../src/estadistica';

describe('GestorSesion', () => {
  const crearSesionBase = (): Sesion => ({
    id: 's1', fecha: '2026-10-06', hora_inicio: '10:00', hora_fin: null,
    valor_apuesta: 0.25, administrador_id: 'p1', estado: 'abierta',
    participantes_ids: ['p1', 'p2', 'p3'], total_partidas: 0, total_apostado_sesion: 0
  });

  const crearStatsBase = (): EstadisticaSesionParticipante[] => [
    { sesion_id: 's1', participante_id: 'p1', partidas_jugadas: 0, partidas_ganadas: 0, partidas_perdidas: 0, partidas_empatadas: 0, total_ganado: 0, total_perdido: 0, balance: 0 },
    { sesion_id: 's1', participante_id: 'p2', partidas_jugadas: 0, partidas_ganadas: 0, partidas_perdidas: 0, partidas_empatadas: 0, total_ganado: 0, total_perdido: 0, balance: 0 },
    { sesion_id: 's1', participante_id: 'p3', partidas_jugadas: 0, partidas_ganadas: 0, partidas_perdidas: 0, partidas_empatadas: 0, total_ganado: 0, total_perdido: 0, balance: 0 }
  ];

  it('debe registrar una partida con ganador y actualizar totales', () => {
    const sesion = crearSesionBase();
    const stats = crearStatsBase();
    const { sesionActualizada, statsActualizadas } = GestorSesion.registrarPartida(sesion, stats, 'm1', '10:00', '10:15', ['p1', 'p2', 'p3'], { tipo: 'ganador', ganador_id: 'p1' });
    expect(sesionActualizada.total_partidas).toBe(1);
    expect(sesionActualizada.total_apostado_sesion).toBe(0.75);
    expect(statsActualizadas[0].balance).toBe(0.50);
    expect(statsActualizadas[1].balance).toBe(-0.25);
  });

  it('debe lanzar un error si la sesión está cerrada al registrar', () => {
    const sesion = { ...crearSesionBase(), estado: 'cerrada' as const };
    const stats = crearStatsBase();
    expect(() => GestorSesion.registrarPartida(sesion, stats, 'm2', '10:00', '10:15', ['p1', 'p2', 'p3'], { tipo: 'ganador', ganador_id: 'p1' })).toThrow('No se pueden registrar partidas en una sesión cerrada.');
  });

  it('debe cerrar la sesión y registrar la hora de fin', () => {
    const sesion = crearSesionBase();
    const cerrada = GestorSesion.cerrarSesion(sesion, '12:00');
    expect(cerrada.estado).toBe('cerrada');
    expect(cerrada.hora_fin).toBe('12:00');
  });

  it('debe lanzar un error si se intenta cerrar una sesión ya cerrada', () => {
    const sesion = { ...crearSesionBase(), estado: 'cerrada' as const };
    expect(() => GestorSesion.cerrarSesion(sesion, '12:00')).toThrow('La sesión ya está cerrada.');
  });
});