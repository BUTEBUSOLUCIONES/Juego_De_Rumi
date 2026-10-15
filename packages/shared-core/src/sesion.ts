export type EstadoSesion = 'abierta' | 'cerrada';

export interface Sesion {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  valor_apuesta: number;
  administrador_id: string;
  estado: EstadoSesion;
  participantes_ids: string[];
  total_partidas: number;
  total_apostado_sesion: number;
}

export function crearSesion(
  id: string,
  fecha: string,
  hora_inicio: string,
  valor_apuesta: number,
  administrador_id: string,
  participantes_ids: string[]
): Sesion {
  if (valor_apuesta <= 0) {
    throw new Error('El valor de la apuesta debe ser mayor que cero.');
  }
  if (participantes_ids.length < 3 || participantes_ids.length > 5) {
    throw new Error('La sesiÃ³n debe tener entre 3 y 5 participantes.');
  }
  if (!participantes_ids.includes(administrador_id)) {
    throw new Error('El administrador debe ser uno de los participantes de la sesiÃ³n.');
  }

  return {
    id,
    fecha,
    hora_inicio,
    hora_fin: null,
    valor_apuesta,
    administrador_id,
    estado: 'abierta',
    participantes_ids,
    total_partidas: 0,
    total_apostado_sesion: 0
  };
}