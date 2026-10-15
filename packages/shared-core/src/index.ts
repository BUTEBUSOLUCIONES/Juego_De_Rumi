export const VERSION = '0.1.0';

export { calcularBalancePartida } from './calculos';
export { crearParticipante } from './participante';
export type { Participante } from './participante';
export { crearSesion } from './sesion';
export type { Sesion, EstadoSesion } from './sesion';
export { crearPartida } from './partida';
export type { Partida, ResultadoPartida, TipoResultado } from './partida';
export { actualizarEstadisticaSesion } from './estadistica';
export type { EstadisticaSesionParticipante, EstadisticaGlobalParticipante } from './estadistica';
export { GestorSesion } from './gestor-sesion';