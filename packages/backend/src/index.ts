import express, { Request, Response } from 'express';
import { VERSION, crearParticipante, crearSesion, GestorSesion, EstadisticaSesionParticipante } from '@partidas/shared-core';
import { db } from './db';

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ mensaje: 'Backend de Partidas de Rumi', version: VERSION });
});

app.get('/prueba', (_req: Request, res: Response) => {
  const participante = crearParticipante('test-1', 'Ana');
  res.json(participante);
});

app.post('/sesiones', (req: Request, res: Response) => {
  try {
    const { id, fecha, hora_inicio, valor_apuesta, administrador_id, participantes_ids } = req.body;
    const sesion = crearSesion(id, fecha, hora_inicio, valor_apuesta, administrador_id, participantes_ids);
    db.sesiones.set(id, sesion);
    const statsIniciales: EstadisticaSesionParticipante[] = participantes_ids.map((pid: string) => ({
      sesion_id: id,
      participante_id: pid,
      partidas_jugadas: 0,
      partidas_ganadas: 0,
      partidas_perdidas: 0,
      partidas_empatadas: 0,
      total_ganado: 0,
      total_perdido: 0,
      balance: 0
    }));
    db.estadisticas.set(id, statsIniciales);
    res.status(201).json(sesion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/partidas', (req: Request, res: Response) => {
  try {
    const { sesionId, partidaId, horaInicio, horaFin, participantesIds, resultado } = req.body;
    const sesion = db.sesiones.get(sesionId);
    if (!sesion) throw new Error('Sesión no encontrada');
    const stats = db.estadisticas.get(sesionId) || [];
    const resultadoGestor = GestorSesion.registrarPartida(sesion, stats, partidaId, horaInicio, horaFin, participantesIds, resultado);
    db.sesiones.set(sesionId, resultadoGestor.sesionActualizada);
    db.estadisticas.set(sesionId, resultadoGestor.statsActualizadas);
    res.status(201).json(resultadoGestor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/sesiones/:id/cerrar', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { horaFin } = req.body;
    const sesion = db.sesiones.get(id);
    if (!sesion) throw new Error('Sesión no encontrada');
    const sesionCerrada = GestorSesion.cerrarSesion(sesion, horaFin);
    db.sesiones.set(id, sesionCerrada);
    res.json(sesionCerrada);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/sesiones/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const sesion = db.sesiones.get(id);
  if (!sesion) {
    res.status(404).json({ error: 'Sesión no encontrada' });
    return;
  }
  const stats = db.estadisticas.get(id) || [];
  res.json({ sesion, estadisticas: stats });
});

app.get('/participantes/:id/estadisticas', (req: Request, res: Response) => {
  const participanteId = req.params.id as string;
  let totalPartidasJugadas = 0;
  let totalPartidasGanadas = 0;
  let totalPartidasPerdidas = 0;
  let totalPartidasEmpatadas = 0;
  let totalGanado = 0;
  let totalPerdido = 0;
  let balanceGlobal = 0;
  let sesionesParticipadas = 0;

  db.estadisticas.forEach((statsArray) => {
    const stat = statsArray.find(s => s.participante_id === participanteId);
    if (stat) {
      sesionesParticipadas++;
      totalPartidasJugadas += stat.partidas_jugadas;
      totalPartidasGanadas += stat.partidas_ganadas;
      totalPartidasPerdidas += stat.partidas_perdidas;
      totalPartidasEmpatadas += stat.partidas_empatadas;
      totalGanado += stat.total_ganado;
      totalPerdido += stat.total_perdido;
      balanceGlobal += stat.balance;
    }
  });

  if (sesionesParticipadas === 0) {
    res.status(404).json({ error: 'Participante no encontrado o sin sesiones' });
    return;
  }

  const estadisticasGlobales = {
    participante_id: participanteId,
    partidas_jugadas: totalPartidasJugadas,
    partidas_ganadas: totalPartidasGanadas,
    partidas_perdidas: totalPartidasPerdidas,
    partidas_empatadas: totalPartidasEmpatadas,
    total_ganado: totalGanado,
    total_perdido: totalPerdido,
    balance: balanceGlobal,
    sesiones_participadas: sesionesParticipadas
  };

  res.json(estadisticasGlobales);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:' + PORT);
  });
}