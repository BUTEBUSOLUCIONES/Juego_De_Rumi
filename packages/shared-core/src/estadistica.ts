import { calcularBalancePartida } from './calculos';

export interface EstadisticaSesionParticipante {
  sesion_id: string;
  participante_id: string;
  partidas_jugadas: number;
  partidas_ganadas: number;
  partidas_perdidas: number;
  partidas_empatadas: number;
  total_ganado: number;
  total_perdido: number;
  balance: number;
}

export interface EstadisticaGlobalParticipante {
  participante_id: string;
  sesiones_jugadas: number;
  partidas_jugadas: number;
  partidas_ganadas: number;
  partidas_perdidas: number;
  partidas_empatadas: number;
  total_ganado: number;
  total_perdido: number;
  balance: number;
}

export function actualizarEstadisticaSesion(
  estadistica: EstadisticaSesionParticipante,
  esGanador: boolean,
  esPerdedor: boolean,
  esEmpate: boolean,
  valorApuesta: number,
  cantidadParticipantes: number
): EstadisticaSesionParticipante {
  const balancePartida = calcularBalancePartida(esGanador, esPerdedor, valorApuesta, cantidadParticipantes);

  return {
    ...estadistica,
    partidas_jugadas: estadistica.partidas_jugadas + 1,
    partidas_ganadas: estadistica.partidas_ganadas + (esGanador ? 1 : 0),
    partidas_perdidas: estadistica.partidas_perdidas + (esPerdedor ? 1 : 0),
    partidas_empatadas: estadistica.partidas_empatadas + (esEmpate ? 1 : 0),
    total_ganado: estadistica.total_ganado + (esGanador ? cantidadParticipantes * valorApuesta : 0),
    total_perdido: estadistica.total_perdido + (esPerdedor ? valorApuesta : 0),
    balance: estadistica.balance + balancePartida
  };
}