import { Sesion, EstadisticaSesionParticipante } from '@partidas/shared-core';

export const db = {
  sesiones: new Map<string, Sesion>(),
  estadisticas: new Map<string, EstadisticaSesionParticipante[]>()
};