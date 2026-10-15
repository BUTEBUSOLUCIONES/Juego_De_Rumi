import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/db';

describe('API Integration', () => {
  beforeEach(() => {
    db.sesiones.clear();
    db.estadisticas.clear();
  });

  it('debe crear una sesión válida vía POST /sesiones', async () => {
    const response = await request(app).post('/sesiones').send({
      id: 's1', fecha: '2026-10-06', hora_inicio: '10:00', valor_apuesta: 0.25,
      administrador_id: 'p1', participantes_ids: ['p1', 'p2', 'p3']
    });
    expect(response.status).toBe(201);
    expect(response.body.estado).toBe('abierta');
  });

  it('debe retornar error 400 si faltan participantes', async () => {
    const response = await request(app).post('/sesiones').send({
      id: 's2', fecha: '2026-10-06', hora_inicio: '10:00', valor_apuesta: 0.25,
      administrador_id: 'p1', participantes_ids: ['p1', 'p2']
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('entre 3 y 5 participantes');
  });

  it('debe registrar una partida y actualizar estadísticas', async () => {
    await request(app).post('/sesiones').send({
      id: 's1', fecha: '2026-10-06', hora_inicio: '10:00', valor_apuesta: 0.25,
      administrador_id: 'p1', participantes_ids: ['p1', 'p2', 'p3']
    });
    const response = await request(app).post('/partidas').send({
      sesionId: 's1', partidaId: 'm1', horaInicio: '10:00', horaFin: '10:15',
      participantesIds: ['p1', 'p2', 'p3'],
      resultado: { tipo: 'ganador', ganador_id: 'p1' }
    });
    expect(response.status).toBe(201);
    expect(response.body.sesionActualizada.total_partidas).toBe(1);
    expect(response.body.statsActualizadas[0].balance).toBe(0.50);
  });

  it('debe cerrar una sesión', async () => {
    await request(app).post('/sesiones').send({
      id: 's1', fecha: '2026-10-06', hora_inicio: '10:00', valor_apuesta: 0.25,
      administrador_id: 'p1', participantes_ids: ['p1', 'p2', 'p3']
    });
    const response = await request(app).post('/sesiones/s1/cerrar').send({ horaFin: '12:00' });
    expect(response.status).toBe(200);
    expect(response.body.estado).toBe('cerrada');
    expect(response.body.hora_fin).toBe('12:00');
  });

  it('debe obtener una sesión con estadísticas vía GET /sesiones/:id', async () => {
    await request(app).post('/sesiones').send({
      id: 's1', fecha: '2026-10-06', hora_inicio: '10:00', valor_apuesta: 0.25,
      administrador_id: 'p1', participantes_ids: ['p1', 'p2', 'p3']
    });
    const response = await request(app).get('/sesiones/s1');
    expect(response.status).toBe(200);
    expect(response.body.sesion.id).toBe('s1');
    expect(response.body.estadisticas).toHaveLength(3);
  });

  it('debe retornar 404 si la sesión no existe', async () => {
    const response = await request(app).get('/sesiones/no-existe');
    expect(response.status).toBe(404);
  });
});