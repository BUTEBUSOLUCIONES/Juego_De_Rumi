import { describe, it, expect } from 'vitest';
import { crearParticipante } from '../src/participante';

describe('Participante', () => {
  it('debe crear un participante correctamente con nombre válido', () => {
    const participante = crearParticipante('uuid-1', 'Carlos');
    expect(participante.id).toBe('uuid-1');
    expect(participante.nombre).toBe('Carlos');
    expect(participante.activo).toBe(true);
  });

  it('debe lanzar un error si el nombre está vacío', () => {
    expect(() => crearParticipante('uuid-2', '   ')).toThrow('El nombre del participante no puede estar vacío.');
  });
});