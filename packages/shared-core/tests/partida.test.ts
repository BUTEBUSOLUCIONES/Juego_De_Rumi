import { describe, it, expect } from 'vitest';
import { crearPartida } from '../src/partida';

describe('Partida', () => {
  const participantes = ['p1', 'p2', 'p3'];
  const valorApuesta = 0.25;

  it('debe crear una partida con ganador correctamente', () => {
    const partida = crearPartida('m1', 's1', '10:00', '10:15', participantes, valorApuesta, { tipo: 'ganador', ganador_id: 'p1' });
    expect(partida.monto_total_apuestas).toBe(0.75);
    expect(partida.resultado.tipo).toBe('ganador');
  });

  it('debe lanzar un error si hay menos de 3 participantes', () => {
    expect(() => crearPartida('m2', 's1', '10:00', '10:15', ['p1', 'p2'], valorApuesta, { tipo: 'ganador', ganador_id: 'p1' })).toThrow('La partida debe tener entre 3 y 5 participantes.');
  });

  it('debe lanzar un error si es ganador pero no se indica el ganador_id', () => {
    expect(() => crearPartida('m3', 's1', '10:00', '10:15', participantes, valorApuesta, { tipo: 'ganador' })).toThrow('Si el resultado es ganador, debe especificarse el ganador_id.');
  });

  it('debe lanzar un error si es empate pero hay menos de 2 empatados', () => {
    expect(() => crearPartida('m4', 's1', '10:00', '10:15', participantes, valorApuesta, { tipo: 'empate', empatados_ids: ['p1'] })).toThrow('Si el resultado es empate, debe haber al menos 2 empatados.');
  });
});