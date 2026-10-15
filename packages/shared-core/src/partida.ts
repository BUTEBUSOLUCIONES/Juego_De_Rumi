export type TipoResultado = 'ganador' | 'empate';

export interface ResultadoPartida {
  tipo: TipoResultado;
  ganador_id?: string;
  empatados_ids?: string[];
}

export interface Partida {
  id: string;
  sesion_id: string;
  hora_inicio: string;
  hora_fin: string;
  participantes_ids: string[];
  monto_total_apuestas: number;
  resultado: ResultadoPartida;
}

export function crearPartida(
  id: string,
  sesion_id: string,
  hora_inicio: string,
  hora_fin: string,
  participantes_ids: string[],
  valor_apuesta: number,
  resultado: ResultadoPartida
): Partida {
  if (participantes_ids.length < 3 || participantes_ids.length > 5) {
    throw new Error('La partida debe tener entre 3 y 5 participantes.');
  }
  if (resultado.tipo === 'ganador' && !resultado.ganador_id) {
    throw new Error('Si el resultado es ganador, debe especificarse el ganador_id.');
  }
  if (resultado.tipo === 'empate' && (!resultado.empatados_ids || resultado.empatados_ids.length < 2)) {
    throw new Error('Si el resultado es empate, debe haber al menos 2 empatados.');
  }

  const monto_total_apuestas = participantes_ids.length * valor_apuesta;

  return {
    id,
    sesion_id,
    hora_inicio,
    hora_fin,
    participantes_ids,
    monto_total_apuestas,
    resultado
  };
}