export interface Participante {
  id: string;
  nombre: string;
  activo: boolean;
}

export function crearParticipante(id: string, nombre: string): Participante {
  const nombreLimpio = nombre.trim();
  if (nombreLimpio.length === 0) {
    throw new Error('El nombre del participante no puede estar vacío.');
  }
  return {
    id,
    nombre: nombreLimpio,
    activo: true
  };
}