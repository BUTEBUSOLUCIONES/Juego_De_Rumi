// Sincronizacion.ts — CON HISTORIAL DE SINCRONIZACIÓN
import {
  actualizarRegistroSincronizacion,
  guardarRegistroSincronizacion,
  obtenerEstadisticasPorSesion,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  obtenerTodosLosParticipantes,
} from './BaseDatos';

// La URL del servidor se obtiene dinámicamente desde ConfiguracionServidor
import { construirUrlServidor } from './ConfiguracionServidor';

function convertirFechaSegura(textoFecha: string): string {
  // Maneja formato: "13-10-2026 15h54"
  const coincidencia = textoFecha.match(
    /(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2})h(\d{2})/
  );
  
  if (coincidencia) {
    const [, dia, mes, anio, hora, minutos] = coincidencia;
    return new Date(
      parseInt(anio),
      parseInt(mes) - 1,  // Meses van de 0 a 11
      parseInt(dia),
      parseInt(hora),
      parseInt(minutos)
    ).toISOString();
  }
  
  // Si no coincide, intentar normal
  return new Date(textoFecha).toISOString();
}
// ==============================================
// 1. SUBIR SESIONES
// ==============================================
async function subirSesiones() {
  console.log('📤 [1/5] Procesando SESIONES...');
  const sesiones = await obtenerSesiones();
  
  // ✅ AGREGA ESTA LÍNEA 👇
  console.log('🔍 SESIONES ENCONTRADAS → Cantidad:', sesiones.length, 'Datos:', sesiones);
  
  const resumen = { nuevos: 0, actualizados: 0, noEnviados: 0, total: sesiones.length };

  // 📝 Registrar inicio
  const registroId = await guardarRegistroSincronizacion({
    fechaInicio: new Date().toISOString(),
    nombreTabla: 'sesiones',
    registrosEnviados: sesiones.length,
    registrosRecibidos: 0,
    estado: 'En proceso',
  });

  for (const sesion of sesiones) {
    try {
      const URL_SERVIDOR = await construirUrlServidor();
      const respuesta = await fetch(`${URL_SERVIDOR}/sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: sesion.numero,
          descripcion: sesion.descripcion,
          valorApuestaBase: sesion.valorApuestaBase,
          estado: sesion.estado,
         fechaCreacion: convertirFechaSegura(sesion.fechaHora),
         // ✅ AGREGA ESTO 👇
         fechaCierre: sesion.estado === 'Finalizada' 
            ? new Date().toISOString() 
            : null,
        }),
      });
      const textoRespuesta = await respuesta.text();
      console.log(`📦 Sesión ${sesion.numero} → HTTP ${respuesta.status}`);
      
      if (respuesta.ok) {
        const detalle = JSON.parse(textoRespuesta);
        detalle.estado === 'nuevo' ? resumen.nuevos++ : resumen.actualizados++;
      } else {
        console.log('⚠️ Respuesta:', textoRespuesta);
        resumen.noEnviados++;
      }
    } catch (err) {
      console.log('❌ EXCEPCIÓN en sesión:', err);
      resumen.noEnviados++;
    }
  }

  // ✅ Finalizar registro
  await actualizarRegistroSincronizacion(registroId.id!, {
    fechaFin: new Date().toISOString(),
    registrosRecibidos: resumen.nuevos + resumen.actualizados,
    estado: resumen.noEnviados === 0 ? 'Completado' : 'Error',
  });

  console.log('──────────────────────────────────');
  console.log('📊 RESUMEN SESIONES:');
  console.log(`   Nuevos:       ${resumen.nuevos}`);
  console.log(`   Actualizados: ${resumen.actualizados}`);
  console.log(`   No enviados:  ${resumen.noEnviados}`);
  console.log(`   Total:        ${resumen.total}`);
  console.log('──────────────────────────────────');
  return resumen;
}

// ==============================================
// 2. SUBIR PARTICIPANTES
// ==============================================
async function subirParticipantes() {
  console.log('📤 [2/5] Procesando PARTICIPANTES...');
  const participantes = await obtenerTodosLosParticipantes();
  const resumen = { nuevos: 0, actualizados: 0, noEnviados: 0, total: participantes.length };

  const registroId = await guardarRegistroSincronizacion({
    fechaInicio: new Date().toISOString(),
    nombreTabla: 'participantes',
    registrosEnviados: participantes.length,
    registrosRecibidos: 0,
    estado: 'En proceso',
  });

  for (const p of participantes) {
    try {
      const URL_SERVIDOR = await construirUrlServidor();
      const respuesta = await fetch(`${URL_SERVIDOR}/participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          nombre: p.nombre,
          estado: p.estado,
          actualizadoEn: new Date().toISOString(),
        }),
      });
      const textoRespuesta = await respuesta.text();
      console.log(`📦 Participante ${p.id} → HTTP ${respuesta.status}`);
      
      if (respuesta.ok) {
        const detalle = JSON.parse(textoRespuesta);
        detalle.estado === 'nuevo' ? resumen.nuevos++ : resumen.actualizados++;
      } else {
        console.log('⚠️ Respuesta:', textoRespuesta);
        resumen.noEnviados++;
      }
    } catch (err) {
      console.log('❌ EXCEPCIÓN en participante:', err);
      resumen.noEnviados++;
    }
  }

  await actualizarRegistroSincronizacion(registroId.id!, {
    fechaFin: new Date().toISOString(),
    registrosRecibidos: resumen.nuevos + resumen.actualizados,
    estado: resumen.noEnviados === 0 ? 'Completado' : 'Error',
  });

  console.log('──────────────────────────────────');
  console.log('📊 RESUMEN PARTICIPANTES:');
  console.log(`   Nuevos:       ${resumen.nuevos}`);
  console.log(`   Actualizados: ${resumen.actualizados}`);
  console.log(`   No enviados:  ${resumen.noEnviados}`);
  console.log(`   Total:        ${resumen.total}`);
  console.log('──────────────────────────────────');
  return resumen;
}

// ==============================================
// 3. SUBIR SESIONES_PARTICIPANTES
// ==============================================
async function subirParticipanteEnSesion() {
  console.log('📤 [3/5] Procesando SESIONES_PARTICIPANTES...');
  const sesiones = await obtenerSesiones();
  const resumen = { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 };

  const registroId = await guardarRegistroSincronizacion({
    fechaInicio: new Date().toISOString(),
    nombreTabla: 'sesiones_participantes',
    registrosEnviados: 0,
    registrosRecibidos: 0,
    estado: 'En proceso',
  });

  for (const sesion of sesiones) {
    const participantes = await obtenerParticipantesPorSesion(sesion.numero);
    console.log(`🔍 Sesión ${sesion.numero} → Participantes encontrados: ${participantes.length}`, participantes);
    resumen.total += participantes.length;
    
    for (const p of participantes) {
      try {
        const URL_SERVIDOR = await construirUrlServidor();
        const respuesta = await fetch(`${URL_SERVIDOR}/sesion-participante`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `ses-${sesion.numero}-${p.participanteId}`,
            sesionNumero: p.numeroSesion,
            participanteId: p.participanteId,
            estadoEnSesion: p.estadoEnSesion,
            partidasGanadas: p.partidasGanadas,
            partidasPerdidas: p.partidasPerdidas,
            valoresGanados: p.valoresGanados,
            valoresPerdidos: p.valoresPerdidos,
            actualizadoEn: new Date().toISOString(),
          }),
        });
        const textoRespuesta = await respuesta.text();
        console.log(`📦 Registro sesión ${sesion.numero} → HTTP ${respuesta.status}`);
        
        if (respuesta.ok) {
          const detalle = JSON.parse(textoRespuesta);
          detalle.estado === 'nuevo' ? resumen.nuevos++ : resumen.actualizados++;
        } else {
          console.log('⚠️ Error:', textoRespuesta);
          resumen.noEnviados++;
        }
      } catch (err) {
        console.log('❌ Excepción:', err);
        resumen.noEnviados++;
      }
    }
  }

  await actualizarRegistroSincronizacion(registroId.id!, {
    fechaFin: new Date().toISOString(),
    registrosEnviados: resumen.total,
    registrosRecibidos: resumen.nuevos + resumen.actualizados,
    estado: resumen.noEnviados === 0 ? 'Completado' : 'Error',
  });

  console.log('──────────────────────────────────');
  console.log('📊 RESUMEN SESIONES_PARTICIPANTES:');
  console.log(`   Nuevos:       ${resumen.nuevos}`);
  console.log(`   Actualizados: ${resumen.actualizados}`);
  console.log(`   No enviados:  ${resumen.noEnviados}`);
  console.log(`   Total:        ${resumen.total}`);
  console.log('──────────────────────────────────');
  return resumen;
}

// ==============================================
// 4. SUBIR PARTIDAS
// ==============================================
async function subirPartidas() {
  console.log('📤 [4/5] Procesando PARTIDAS...');
  const sesiones = await obtenerSesiones();
  const resumen = { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 };

  const registroId = await guardarRegistroSincronizacion({
    fechaInicio: new Date().toISOString(),
    nombreTabla: 'partidas',
    registrosEnviados: 0,
    registrosRecibidos: 0,
    estado: 'En proceso',
  });

  for (const sesion of sesiones) {
    const partidas = await obtenerPartidasPorSesion(sesion.numero);
    resumen.total += partidas.length;
    
    for (const partida of partidas) {
      try {
        const fechaBase = partida.fechaHoraFinalizacion || partida.fechaHoraInicio;
        const URL_SERVIDOR = await construirUrlServidor();
        const respuesta = await fetch(`${URL_SERVIDOR}/partida`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: partida.identificador!,
            numero: partida.numero,
            sesionNumero: partida.numeroSesion,
            estado: partida.estado,
            sincronizado: true,
            actualizadoEn: new Date(fechaBase).toISOString(),
          }),
        });
        
        if (respuesta.ok) {
          const detalle = await respuesta.json();
          detalle.estado === 'nuevo' ? resumen.nuevos++ : resumen.actualizados++;
        } else {
          console.log('⚠️ Error en partida:', await respuesta.text());
          resumen.noEnviados++;
        }
      } catch (err) {
        console.log('❌ EXCEPCIÓN en partida:', err);
        resumen.noEnviados++;
      }
    }
  }

  await actualizarRegistroSincronizacion(registroId.id!, {
    fechaFin: new Date().toISOString(),
    registrosEnviados: resumen.total,
    registrosRecibidos: resumen.nuevos + resumen.actualizados,
    estado: resumen.noEnviados === 0 ? 'Completado' : 'Error',
  });

  console.log('──────────────────────────────────');
  console.log('📊 RESUMEN PARTIDAS:');
  console.log(`   Nuevos:       ${resumen.nuevos}`);
  console.log(`   Actualizados: ${resumen.actualizados}`);
  console.log(`   No enviados:  ${resumen.noEnviados}`);
  console.log(`   Total:        ${resumen.total}`);
  console.log('──────────────────────────────────');
  return resumen;
}

// ==============================================
// 5. SUBIR ESTADÍSTICAS
// ==============================================
async function subirEstadisticas() {
  console.log('📤 [5/5] Procesando ESTADÍSTICAS...');
  const sesiones = await obtenerSesiones();
  const resumen = { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 };

  const registroId = await guardarRegistroSincronizacion({
    fechaInicio: new Date().toISOString(),
    nombreTabla: 'estadisticas',
    registrosEnviados: 0,
    registrosRecibidos: 0,
    estado: 'En proceso',
  });

  for (const sesion of sesiones) {
    const estadisticas = await obtenerEstadisticasPorSesion(sesion.numero);
    resumen.total += estadisticas.length;
    
    for (const est of estadisticas) {
      try {
        const URL_SERVIDOR = await construirUrlServidor();
        const respuesta = await fetch(`${URL_SERVIDOR}/estadistica`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `est-${sesion.numero}-${est.participanteId}`,
            sesionNumero: sesion.numero,
            participanteId: est.participanteId,
            partidasGanadas: est.partidasGanadas,
            partidasPerdidas: est.partidasPerdidas,
            valoresGanados: est.valoresGanados,
            valoresPerdidos: est.valoresPerdidos,
            saldo: est.saldo,
            actualizadoEn: new Date().toISOString(),
          }),
        });
        
        if (respuesta.ok) {
          const detalle = await respuesta.json();
          detalle.estado === 'nuevo' ? resumen.nuevos++ : resumen.actualizados++;
        } else {
          console.log('⚠️ Error en estadística:', await respuesta.text());
          resumen.noEnviados++;
        }
      } catch (err) {
        console.log('❌ EXCEPCIÓN en estadística:', err);
        resumen.noEnviados++;
      }
    }
  }

  await actualizarRegistroSincronizacion(registroId.id!, {
    fechaFin: new Date().toISOString(),
    registrosEnviados: resumen.total,
    registrosRecibidos: resumen.nuevos + resumen.actualizados,
    estado: resumen.noEnviados === 0 ? 'Completado' : 'Error',
  });

  console.log('──────────────────────────────────');
  console.log('📊 RESUMEN ESTADÍSTICAS:');
  console.log(`   Nuevos:       ${resumen.nuevos}`);
  console.log(`   Actualizados: ${resumen.actualizados}`);
  console.log(`   No enviados:  ${resumen.noEnviados}`);
  console.log(`   Total:        ${resumen.total}`);
  console.log('──────────────────────────────────');
  return resumen;
}

// ==============================================
// DESCARGAR NOVEDADES
// ==============================================
async function bajarNovedades() {
  console.log('📥 Descargando novedades...');
  try {
    const desde = '2000-10-13T00:00:00.000Z';
    const URL_SERVIDOR = await construirUrlServidor();
    const respuesta = await fetch(`${URL_SERVIDOR}/actualizaciones?desde=${desde}`);
    
    if (!respuesta.ok) {
      console.log('⚠️ Sin conexión al servidor');
      return;
    }
    const datos = await respuesta.json();
    const total = datos.nuevos?.length || 0;
    
    console.log('📊 RESUMEN DESCARGA:');
    console.log(`   Recibidos:    ${total}`);
    console.log(`   Sin novedades: ${total === 0 ? 'Sí' : 'No'}`);
  } catch (err) {
    console.log('❌ Error en descarga:', err);
  }
  console.log('══════════════════════════════════');
}

// ==============================================
// RESULTADO DE SINCRONIZACIÓN — Nueva estructura
// ==============================================
export type ResultadoSincronizacion = {
  exito: boolean;
  mensaje: string;
  servidorDisponible: boolean;
  duracionMs: number;
  detalles: {
    sesiones: { nuevos: number; actualizados: number; noEnviados: number; total: number };
    participantes: { nuevos: number; actualizados: number; noEnviados: number; total: number };
    sesionesParticipantes: { nuevos: number; actualizados: number; noEnviados: number; total: number };
    partidas: { nuevos: number; actualizados: number; noEnviados: number; total: number };
    estadisticas: { nuevos: number; actualizados: number; noEnviados: number; total: number };
  };
  errores: string[];
};

// ==============================================
// FUNCIÓN: verificarServidor
// Propósito: Comprueba si el servidor responde antes de sincronizar
// ==============================================
async function verificarServidor(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const URL_SERVIDOR = await construirUrlServidor();
    const respuesta = await fetch(`${URL_SERVIDOR}/actualizaciones?desde=2000-01-01`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return respuesta.ok;
  } catch {
    return false;
  }
}

// ==============================================
// FUNCIÓN PRINCIPAL — Versión mejorada
// ==============================================
export async function sincronizarTodo(): Promise<ResultadoSincronizacion> {
  const inicio = Date.now();
  const errores: string[] = [];
  const detalles: ResultadoSincronizacion['detalles'] = {
    sesiones: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
    participantes: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
    sesionesParticipantes: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
    partidas: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
    estadisticas: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
  };

  console.log('🔄 INICIANDO SINCRONIZACIÓN COMPLETA');

  // 1. Verificar disponibilidad del servidor
  const servidorDisponible = await verificarServidor();
  if (!servidorDisponible) {
    const duracionMs = Date.now() - inicio;
    console.log('❌ SERVIDOR NO DISPONIBLE');
    return {
      exito: false,
      mensaje: 'El servidor no está disponible. Revisa tu conexión a la red.',
      servidorDisponible: false,
      duracionMs,
      detalles,
      errores: ['Servidor no responde en ' + (await construirUrlServidor())],
    };
  }

  // 2. Ejecutar las 5 fases
  try {
    detalles.sesiones = await subirSesiones();
  } catch (e) {
    errores.push('Error en sesiones: ' + String(e));
  }

  try {
    detalles.participantes = await subirParticipantes();
  } catch (e) {
    errores.push('Error en participantes: ' + String(e));
  }

  try {
    detalles.sesionesParticipantes = await subirParticipanteEnSesion();
  } catch (e) {
    errores.push('Error en sesiones_participantes: ' + String(e));
  }

  try {
    detalles.partidas = await subirPartidas();
  } catch (e) {
    errores.push('Error en partidas: ' + String(e));
  }

  try {
    detalles.estadisticas = await subirEstadisticas();
  } catch (e) {
    errores.push('Error en estadísticas: ' + String(e));
  }

  try {
    await bajarNovedades();
  } catch (e) {
    errores.push('Error al bajar novedades: ' + String(e));
  }

  // 3. Calcular totales
  const totalNoEnviados =
    detalles.sesiones.noEnviados +
    detalles.participantes.noEnviados +
    detalles.sesionesParticipantes.noEnviados +
    detalles.partidas.noEnviados +
    detalles.estadisticas.noEnviados;

  const totalEnviados =
    detalles.sesiones.nuevos + detalles.sesiones.actualizados +
    detalles.participantes.nuevos + detalles.participantes.actualizados +
    detalles.sesionesParticipantes.nuevos + detalles.sesionesParticipantes.actualizados +
    detalles.partidas.nuevos + detalles.partidas.actualizados +
    detalles.estadisticas.nuevos + detalles.estadisticas.actualizados;

  const duracionMs = Date.now() - inicio;

  // 4. Determinar resultado final
  if (totalNoEnviados === 0 && errores.length === 0) {
    console.log('✅ SINCRONIZACIÓN FINALIZADA');
    return {
      exito: true,
      mensaje: `Sincronización completa. ${totalEnviados} registros procesados.`,
      servidorDisponible: true,
      duracionMs,
      detalles,
      errores: [],
    };
  }

  if (totalEnviados === 0 && totalNoEnviados > 0) {
    return {
      exito: false,
      mensaje: `Sincronización fallida. ${totalNoEnviados} registros no se pudieron enviar.`,
      servidorDisponible: true,
      duracionMs,
      detalles,
      errores,
    };
  }

  return {
    exito: true,
    mensaje: `Sincronización parcial. ${totalEnviados} enviados, ${totalNoEnviados} fallidos.`,
    servidorDisponible: true,
    duracionMs,
    detalles,
    errores,
  };
}