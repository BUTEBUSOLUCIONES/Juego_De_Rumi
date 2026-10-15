import { describe, it, expect } from 'vitest';
import { calcularBalancePartida } from '../src/calculos';

describe('Cálculos de Partida', () => {
  const valorApuesta = 0.25;

  it('debe calcular el balance positivo cuando el participante es ganador', () => {
    const balance = calcularBalancePartida(true, false, valorApuesta, 4);
    expect(balance).toBe(0.75);
  });

  it('debe calcular el balance negativo cuando el participante es perdedor', () => {
    const balance = calcularBalancePartida(false, true, valorApuesta, 4);
    expect(balance).toBe(-0.25);
  });

  it('debe retornar cero cuando hay empate', () => {
    const balance = calcularBalancePartida(false, false, valorApuesta, 4);
    expect(balance).toBe(0);
  });
});