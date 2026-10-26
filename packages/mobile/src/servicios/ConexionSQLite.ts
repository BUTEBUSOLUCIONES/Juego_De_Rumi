// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\ConexionSQLite.ts
// Inicialización y gestión de la conexión a la base de datos SQLite local.
// Crea la base de datos 'rumi.db' al primer arranque y ejecuta todas las sentencias
// CREATE TABLE e índices necesarios para el funcionamiento de la aplicación.
// Este archivo es el punto de entrada para todas las operaciones de base de datos.

import * as SQLite from 'expo-sqlite';

// Nombre del archivo de base de datos que se creará en el dispositivo
const NOMBRE_BASE_DATOS = 'rumi.db';

// Variable que almacena la conexión activa (patrón Singleton)
let conexionActiva: SQLite.SQLiteDatabase | null = null;

// ==============================================================
// FUNCIÓN: obtenerConexion
// INICIO
// Propósito: Retorna la conexión activa a la base de datos SQLite.
// Si no existe una conexión previa, lanza un error indicando que 
// primero se debe ejecutar inicializarBaseDatosSQLite().
// Retorna: La instancia activa de SQLiteDatabase.
// ==============================================================
export function obtenerConexion(): SQLite.SQLiteDatabase {
  if (!conexionActiva) {
    throw new Error(
      'La base de datos no ha sido inicializada. ' +
      'Debes llamar a inicializarBaseDatosSQLite() al arrancar la app.'
    );
  }
  return conexionActiva;
}
// ==============================================================
// FIN: obtenerConexion
// ==============================================================

// ==============================================================
// FUNCIÓN: crearTablas
// INICIO
// Propósito: Ejecuta todas las sentencias SQL necesarias para crear 
// las 6 tablas del sistema (sesiones, participantes, participantes_sesion, 
// partidas, historial_sincronizacion, estadisticas) y sus índices.
// Utiliza IF NOT EXISTS para ser segura ante múltiples ejecuciones.
// ==============================================================
async function crearTablas(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Tabla de Sesiones
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sesiones (
      numero INTEGER PRIMARY KEY,
      fecha_hora TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      valor_apuesta_base REAL NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'Activa',
      sincronizado TEXT NOT NULL DEFAULT 'Pendiente'
    );
    CREATE INDEX IF NOT EXISTS idx_sesiones_sync ON sesiones(sincronizado);
  `);

  // 2. Tabla de Participantes
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS participantes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Activo',
      fecha_registro TEXT NOT NULL,
      sincronizado TEXT NOT NULL DEFAULT 'Pendiente'
    );
    CREATE INDEX IF NOT EXISTS idx_participantes_sync ON participantes(sincronizado);
  `);

  // 3. Tabla de Participantes en Sesión
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS participantes_sesion (
      id TEXT PRIMARY KEY,
      sesion_numero INTEGER NOT NULL,
      participante_id TEXT NOT NULL,
      nombre TEXT NOT NULL,
      estado_en_sesion TEXT NOT NULL DEFAULT 'Activo',
      partidas_ganadas INTEGER NOT NULL DEFAULT 0,
      partidas_perdidas INTEGER NOT NULL DEFAULT 0,
      valores_ganados REAL NOT NULL DEFAULT 0,
      valores_perdidos REAL NOT NULL DEFAULT 0,
      sincronizado TEXT NOT NULL DEFAULT 'Pendiente',
      FOREIGN KEY (sesion_numero) REFERENCES sesiones(numero) ON DELETE CASCADE,
      FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_part_sesion_numero ON participantes_sesion(sesion_numero);
    CREATE INDEX IF NOT EXISTS idx_part_sesion_sync ON participantes_sesion(sincronizado);
  `);

  // 4. Tabla de Partidas
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS partidas (
      identificador TEXT PRIMARY KEY,
      numero_sesion INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      estado TEXT NOT NULL DEFAULT 'EnCurso',
      identificador_ganador TEXT,
      monto_ganado REAL NOT NULL DEFAULT 0,
      fecha_hora_inicio TEXT NOT NULL,
      fecha_hora_finalizacion TEXT,
      sincronizado TEXT NOT NULL DEFAULT 'Pendiente',
      FOREIGN KEY (numero_sesion) REFERENCES sesiones(numero) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_partidas_sesion ON partidas(numero_sesion);
    CREATE INDEX IF NOT EXISTS idx_partidas_sync ON partidas(sincronizado);
  `);

  // 5. Tabla de Historial de Sincronización
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS historial_sincronizacion (
      id TEXT PRIMARY KEY,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT,
      nombre_tabla TEXT NOT NULL,
      registros_enviados INTEGER NOT NULL DEFAULT 0,
      registros_recibidos INTEGER NOT NULL DEFAULT 0,
      mensaje TEXT,
      estado TEXT NOT NULL DEFAULT 'En proceso'
    );
  `);

  // 6. Tabla de Estadísticas (NUEVA)
  // Acumula datos por participante, año y mes.
  // El mes 0 se reserva para el resumen anual del participante.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS estadisticas (
      id TEXT PRIMARY KEY,
      participante_id TEXT NOT NULL,
      anio INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      sesiones_jugadas INTEGER NOT NULL DEFAULT 0,
      partidas_ganadas INTEGER NOT NULL DEFAULT 0,
      partidas_perdidas INTEGER NOT NULL DEFAULT 0,
      valores_ganados REAL NOT NULL DEFAULT 0,
      valores_perdidos REAL NOT NULL DEFAULT 0,
      saldo REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_estadisticas_participante ON estadisticas(participante_id);
    CREATE INDEX IF NOT EXISTS idx_estadisticas_periodo ON estadisticas(anio, mes);
  `);

  console.log('✅ Todas las tablas e índices creados correctamente.');
}
// ==============================================================
// FIN: crearTablas
// ==============================================================

// ==============================================================
// FUNCIÓN: inicializarBaseDatosSQLite
// INICIO
// Propósito: Punto de entrada principal para inicializar la base de datos.
// Abre (o crea) el archivo rumi.db, crea todas las tablas e índices, 
// y guarda la conexión activa para uso posterior.
// Debe llamarse UNA SOLA VEZ al arrancar la aplicación (en App.tsx).
// Retorna: Un objeto con el resultado de la inicialización.
// ==============================================================
export async function inicializarBaseDatosSQLite(): Promise<{
  exito: boolean;
  mensaje: string;
}> {
  try {
    // Si ya hay una conexión activa, no hacemos nada (evita duplicados)
    if (conexionActiva) {
      return { exito: true, mensaje: 'Base de datos ya estaba inicializada' };
    }

    console.log('🔄 Inicializando base de datos SQLite...');
    
    // Abrir (o crear) la base de datos
    const db = await SQLite.openDatabaseAsync(NOMBRE_BASE_DATOS);
    
    // Crear todas las tablas e índices
    await crearTablas(db);
    
    // Guardar la conexión activa para uso futuro
    conexionActiva = db;
    
    console.log('✅ Base de datos SQLite inicializada correctamente.');
    return { exito: true, mensaje: 'Base de datos SQLite lista' };
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos SQLite:', error);
    return { 
      exito: false, 
      mensaje: `Error: ${(error as Error).message}` 
    };
  }
}
// ==============================================================
// FIN: inicializarBaseDatosSQLite
// ==============================================================

// ==============================================================
// FUNCIÓN: cerrarConexion
// INICIO
// Propósito: Cierra la conexión activa a la base de datos.
// Útil para pruebas o cuando la app se cierra completamente.
// ==============================================================
export async function cerrarConexion(): Promise<void> {
  if (conexionActiva) {
    await conexionActiva.closeAsync();
    conexionActiva = null;
    console.log('🔒 Conexión a SQLite cerrada.');
  }
}
// ==============================================================
// FIN: cerrarConexion
// ==============================================================