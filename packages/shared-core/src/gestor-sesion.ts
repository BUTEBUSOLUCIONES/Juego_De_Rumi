import { Sesion, EstadoSesion } from './sesion';
import { Partida, crearPartida, ResultadoPartida } from './partida';
import { EstadisticaSesionParticipante, actualizarEstadisticaSesion } from './estadistica';

export class GestorSesion {
  static registrarPartida(
    sesion: Sesion,
    stats: EstadisticaSesionParticipante[],
    partidaId: string,
    horaInicio: string,
    horaFin: string,
    participantesIds: string[],
    resultado: ResultadoPartida
  ): { sesionActualizada: Sesion; statsActualizadas: EstadisticaSesionParticipante[]; nuevaPartida: Partida } {
    if (sesion.estado !== 'abierta') {
      throw new Error('No se pueden registrar partidas en una sesión cerrada.');
    }

    const nuevaPartida = crearPartida(partidaId, sesion.id, horaInicio, horaFin, participantesIds, sesion.valor_apuesta, resultado);

    const sesionActualizada = {
      ...sesion,
      total_partidas: sesion.total_partidas + 1,
      total_apostado_sesion: sesion.total_apostado_sesion + nuevaPartida.monto_total_apuestas
    };

    const statsActualizadas = stats.map(stat => {
      if (!participantesIds.includes(stat.participante_id)) return stat;
      const esGanador = resultado.tipo === 'ganador' && resultado.ganador_id === stat.participante_id;
      const esPerdedor = resultado.tipo === 'ganador' && resultado.ganador_id !== stat.participante_id;
      const esEmpate = resultado.tipo === 'empate';
      return actualizarEstadisticaSesion(stat, esGanador, esPerdedor, esEmpate, sesion.valor_apuesta, participantesIds.length);
    });

    return { sesionActualizada, statsActualizadas, nuevaPartida };
  }

  static cerrarSesion(sesion: Sesion, horaFin: string): Sesion {
    if (sesion.estado === 'cerrada') {
      throw new Error('La sesión ya está cerrada.');
    }
    return {
      ...sesion,
      estado: 'cerrada' as EstadoSesion,
      hora_fin: horaFin
    };
  }
}