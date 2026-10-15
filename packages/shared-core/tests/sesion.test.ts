import { describe, it, expect } from 'vitest';
import { crearSesion } from '../src/sesion';

describe('Sesion', () => {
  const participantesValidos = ['p1', 'p2', 'p3'];
  const adminId = 'p1';

  it('debe crear una sesiÃ³n correctamente con datos vÃ¡lidos', () => {
    const sesion = crearSesion('s1', '2026-10-06', '10:00', 0.25, adminId, participantesValidos);
    expect(sesion.estado).toBe('abierta');
    expect(sesion.valor_apuesta).toBe(0.25);
    expect(sesion.total_partidas).toBe(0);
  });

  it('debe lanzar un error si el valor de apuesta es cero o negativo', () => {
    expect(() => crearSesion('s2', '2026-10-06', '10:00', 0, adminId, participantesValidos)).toThrow('El valor de la apuesta debe ser mayor que cero.');
  });

  it('debe lanzar un error si hay menos de 3 participantes', () => {
    expect(() => crearSesion('s3', '2026-10-06', '10:00', 0.25, adminId, ['p1', 'p2'])).toThrow('La sesiÃ³n debe tener entre 3 y 5 participantes.');
  });

  it('debe lanzar un error si el administrador no estÃ¡ en la lista de participantes', () => {
    expect(() => crearSesion('s4', '2026-10-06', '10:00', 0.25, 'admin_externo', participantesValidos)).toThrow('El administrador debe ser uno de los participantes de la sesiÃ³n.');
  });
});