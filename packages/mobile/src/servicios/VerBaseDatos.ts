// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\VerBaseDatos.ts
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 22/10/2026  | 1.1.0   | Reemplazo de console.table por JSON.stringify para compatibilidad con Expo. |

import { obtenerConexion } from './ConexionSQLite';

const TABLAS_BASE_DATOS = [
  'sesiones',
  'participantes',
  'participantes_sesion',
  'partidas',
  'historial_sincronizacion'
] as const;

// ==============================================================
// FUNCIÓN: mostrarTabla
// INICIO
// Propósito: Consulta y muestra en consola todos los registros de una tabla.
// Parámetros: nombreTabla (string).
// Retorna: Promise<void>
// ==============================================================
async function mostrarTabla(nombreTabla: string): Promise<void> {
  try {
    const conexion = obtenerConexion();
    const filas = await conexion.getAllAsync(`SELECT * FROM ${nombreTabla}`);
    
    console.log(`\n📋 === ${nombreTabla.toUpperCase()} (${filas ? filas.length : 0} registros) ===`);
    
    if (filas && filas.length > 0) {
      // ✅ JSON.stringify es 100% compatible con la consola de Expo/React Native
      console.log(JSON.stringify(filas, null, 2));
    } else {
      console.log('⚠️ La tabla está vacía.');
    }
  } catch (error) {
    console.error(`❌ Error leyendo la tabla ${nombreTabla}:`, error);
  }
}
// ==============================================================
// FIN: mostrarTabla
// ==============================================================

// ==============================================================
// FUNCIÓN: verTodaLaBase
// INICIO
// Propósito: Itera y muestra el contenido de todas las tablas principales.
// Parámetros: Ninguno.
// Retorna: Promise<void>
// ==============================================================
export async function verTodaLaBase(): Promise<void> {
  console.log('\n🔍 === CONTENIDO DE LA BASE DE DATOS LOCAL: rumi.db ===');
  
  for (const tabla of TABLAS_BASE_DATOS) {
    await mostrarTabla(tabla);
  }
  
  console.log('\n✅ Fin de la consulta de la base de datos.\n');
}
// ==============================================================
// FIN: verTodaLaBase
// ==============================================================