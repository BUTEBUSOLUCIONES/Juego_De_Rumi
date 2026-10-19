// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\Sincronizacion.ts
// ✅ ALINEADO CON: main.py camelCase (sesionNumero, estadoEnSesion, actualizadoEn)

import {
  marcarParticipanteEnSesionSincronizado,
  marcarParticipanteSincronizado,
  marcarPartidaSincronizada,
  marcarSesionSincronizada,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  obtenerTodosLosParticipantes
} from './BaseDatos';
import { construirUrlServidor } from './ConfiguracionServidor';

function convertirFechaSegura(textoFecha: string): string {
  if (!textoFecha) return new Date().toISOString();
  const coincidencia = textoFecha.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2})h(\d{2})/);
  if (coincidencia) {
    const [, dia, mes, anio, hora, minuto] = coincidencia;
    return new Date(`${anio}-${mes}-${dia}T${hora}:${minuto}:00`).toISOString();
  }
  return new Date(textoFecha).toISOString();
}

type ResumenEnvio = {
  nuevos: number;
  actualizados: number;
  errores: number;
  total: number;
};

export type ResultadoSincronizacion = {
  exito: boolean;
  mensaje: string;
  servidorActivo: boolean;
  resumen: ResumenEnvio;
  errores: string[];
};

function debeEnviar(elemento: { sincronizado?: string | null }): boolean {
  return elemento.sincronizado !== 'Sincronizado';
}

async function verificarServidor(): Promise<boolean> {
  try {
    const respuesta = await fetch('http://localhost:8000/docs', { method: 'GET' });
    return respuesta.ok;
  } catch {
    return false;
  }
}

// ==============================================================
// PARTICIPANTES — coincidir con ParticipanteCreate
// ==============================================================
async function enviarParticipantes(baseUrl: string): Promise<ResumenEnvio> {
  console.log('📤 Enviando participantes_general...');
  const todos = await obtenerTodosLosParticipantes();
  const pendientes = todos.filter(debeEnviar);
  
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: pendientes.length };

  for (const p of pendientes) {
    try {
      const respuesta = await fetch(`${baseUrl}/rumi/api/sincronizar/participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          nombre: p.nombre,
          estado: p.estado,
          actualizadoEn: p.fechaRegistro || new Date().toISOString()
        })
      });

      const datos = await respuesta.json();
      if (datos.respuesta === 'nuevo') resumen.nuevos++;
      else if (datos.respuesta === 'actualizado') resumen.actualizados++;

      await marcarParticipanteSincronizado(p.id);
    } catch (error) {
      resumen.errores++;
      console.log('❌ Participante error:', p.id, error);
    }
  }

  console.log(`✅ Participantes: ${resumen.nuevos} nuevos, ${resumen.actualizados} actualizados`);
  return resumen;
}

// ==============================================================
// SESIONES — coincidir con SesionCreate
// ==============================================================
async function enviarSesiones(baseUrl: string): Promise<ResumenEnvio> {
  console.log('📤 Enviando sesiones...');
  const todas = await obtenerSesiones();
  const pendientes = todas.filter(debeEnviar);
  
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: pendientes.length };

  for (const s of pendientes) {
    try {
      const respuesta = await fetch(`${baseUrl}/rumi/api/sincronizar/sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: s.numero,
          descripcion: s.descripcion,
          valorApuestaBase: s.valorApuestaBase,
          estado: s.estado,
          fechaCreacion: convertirFechaSegura(s.fechaHora)
        })
      });

      const datos = await respuesta.json();
      if (datos.respuesta === 'nuevo') resumen.nuevos++;
      else if (datos.respuesta === 'actualizado') resumen.actualizados++;

      await marcarSesionSincronizada(s.numero);
    } catch (error) {
      resumen.errores++;
      console.log('❌ Sesión error:', s.numero, error);
    }
  }

  console.log(`✅ Sesiones: ${resumen.nuevos} nuevas, ${resumen.actualizados} actualizadas`);
  return resumen;
}

// ==============================================================
// PARTICIPANTES-SESIÓN — coincidir con SesionParticipanteCreate
// ==============================================================
async function enviarParticipantesSesion(baseUrl: string): Promise<ResumenEnvio> {
  console.log('📤 Enviando participantes_sesion...');
  const sesiones = await obtenerSesiones();
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: 0 };

  for (const sesion of sesiones) {
    const participantes = await obtenerParticipantesPorSesion(sesion.numero);
    const pendientes = participantes.filter(debeEnviar);
    resumen.total += pendientes.length;

    for (const p of pendientes) {
      try {
        const respuesta = await fetch(`${baseUrl}/rumi/api/sincronizar/sesion-participante`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sesionNumero: p.numeroSesion,
            participanteId: p.participanteId,
            nombre: p.nombre,
            estadoEnSesion: p.estadoEnSesion,
            partidasGanadas: p.partidasGanadas,
            partidasPerdidas: p.partidasPerdidas,
            valoresGanados: p.valoresGanados,
            valoresPerdidos: p.valoresPerdidos,
            actualizadoEn: new Date().toISOString(),
            estado: 'Activo'
          })
        });

        const datos = await respuesta.json();
        if (datos.respuesta === 'nuevo') resumen.nuevos++;
        else if (datos.respuesta === 'actualizado') resumen.actualizados++;

        await marcarParticipanteEnSesionSincronizado(p.numeroSesion, p.participanteId);
      } catch (error) {
        resumen.errores++;
        console.log('❌ Participante-sesión error:', p.numeroSesion, p.participanteId, error);
      }
    }
  }

  console.log(`✅ Participantes-sesión: ${resumen.nuevos} nuevos, ${resumen.actualizados} actualizados`);
  return resumen;
}

// ==============================================================
// PARTIDAS — coincidir con PartidaCreate
// ==============================================================
async function enviarPartidas(baseUrl: string): Promise<ResumenEnvio> {
  console.log('📤 Enviando partidas...');
  const sesiones = await obtenerSesiones();
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: 0 };

  for (const sesion of sesiones) {
    const partidas = await obtenerPartidasPorSesion(sesion.numero);
    const pendientes = partidas.filter(debeEnviar);
    resumen.total += pendientes.length;

    for (const p of pendientes) {
      try {
        const respuesta = await fetch(`${baseUrl}/rumi/api/sincronizar/partida`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: p.identificador,
            numero: p.numero,
            sesionNumero: p.numeroSesion,
            estado: p.estado,
            sincronizado: true,
            actualizadoEn: new Date().toISOString()
          })
        });

        const datos = await respuesta.json();
        if (datos.respuesta === 'nuevo') resumen.nuevos++;
        else if (datos.respuesta === 'actualizado') resumen.actualizados++;

        if (p.identificador) await marcarPartidaSincronizada(p.identificador);
      } catch (error) {
        resumen.errores++;
        console.log('❌ Partida error:', p.identificador, error);
      }
    }
  }

  console.log(`✅ Partidas: ${resumen.nuevos} nuevas, ${resumen.actualizados} actualizadas`);
  return resumen;
}

// ==============================================================
// FUNCIÓN PRINCIPAL
// ==============================================================
export async function sincronizarTodo(): Promise<ResultadoSincronizacion> {
  console.log('='.repeat(50));
  console.log('🔄 INICIANDO SINCRONIZACIÓN...');
  console.log('='.repeat(50));

  const baseUrl = await construirUrlServidor();
  const servidorActivo = await verificarServidor();
  
  if (!servidorActivo) {
    return {
      exito: false,
      mensaje: 'No se puede conectar con el servidor',
      servidorActivo: false,
      resumen: { nuevos: 0, actualizados: 0, errores: 0, total: 0 },
      errores: ['Servidor inalcanzable → verifica IP/puerto']
    };
  }

  const horaInicio = Date.now();
  const resumenParticipantes = await enviarParticipantes(baseUrl);
  const resumenSesiones = await enviarSesiones(baseUrl);
  const resumenParticipantesSesion = await enviarParticipantesSesion(baseUrl);
  const resumenPartidas = await enviarPartidas(baseUrl);

  const tiempoTotal = Math.round((Date.now() - horaInicio) / 1000);
  const resumenFinal: ResumenEnvio = {
    nuevos: resumenParticipantes.nuevos + resumenSesiones.nuevos + resumenParticipantesSesion.nuevos + resumenPartidas.nuevos,
    actualizados: resumenParticipantes.actualizados + resumenSesiones.actualizados + resumenParticipantesSesion.actualizados + resumenPartidas.actualizados,
    errores: resumenParticipantes.errores + resumenSesiones.errores + resumenParticipantesSesion.errores + resumenPartidas.errores,
    total: resumenParticipantes.total + resumenSesiones.total + resumenParticipantesSesion.total + resumenPartidas.total
  };

  console.log('='.repeat(50));
  console.log(`🏁 SINCRONIZACIÓN COMPLETA — ${tiempoTotal}s`);
  console.log(`   Total: ${resumenFinal.total} | Nuevos: ${resumenFinal.nuevos} | Actualizados: ${resumenFinal.actualizados} | Errores: ${resumenFinal.errores}`);
  console.log('='.repeat(50));

  return {
    exito: resumenFinal.errores === 0,
    mensaje: resumenFinal.errores === 0 
      ? `Sincronización completa (${tiempoTotal}s)` 
      : `Sincronizada con ${resumenFinal.errores} errores`,
    servidorActivo: true,
    resumen: resumenFinal,
    errores: []
  };
}