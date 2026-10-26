// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\ConfiguracionServidor.ts
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 17/10/2026  | 1.0.0   | Versión inicial del servicio de configuración del servidor. |
// | 22/10/2026  | 1.1.0   | Agregado soporte para sincronización automática e intervalo en minutos. |

// Servicio de configuración del servidor
// Guarda y lee IP, puerto, carpeta y opciones de sincronización desde el almacenamiento local
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================
// CLAVE GLOBAL DE ACCESO
// Propósito: Proteger el acceso al formulario de configuración
// NOTA: Si cambia el año, actualizar esta constante
// ==============================================================
export const CLAVE_GLOBAL = '2026.admin';

// ==============================================================
// CLAVE DE ALMACENAMIENTO
// ==============================================================
const CLAVE_ALMACENAMIENTO = '@Rumi/ConfiguracionServidor';

// ==============================================================
// TIPO: ConfiguracionServidor
// Propósito: Estructura de los datos del servidor y sincronización
// ==============================================================
export type ConfiguracionServidor = {
  ip: string;
  puerto: string;
  carpeta: string;
  sincronizacionAutomatica: boolean;
  intervaloSincronizacion: number;
};

// ==============================================================
// VALORES POR DEFECTO
// Propósito: Configuración inicial si no existe nada guardado
// ==============================================================
const CONFIGURACION_POR_DEFECTO: ConfiguracionServidor = {
  ip: '192.168.1.53',
  puerto: '8000',
  carpeta: '/rumi/api/sincronizar/',
  sincronizacionAutomatica: false,
  intervaloSincronizacion: 60, // 60 minutos por defecto
};

// ==============================================================
// FUNCIÓN: obtenerConfiguracion
// INICIO
// Propósito: Lee la configuración guardada o devuelve la por defecto.
//            Garantiza compatibilidad hacia atrás con configuraciones antiguas.
// Parámetros: Ninguno.
// Retorna: Promise<ConfiguracionServidor>
// ==============================================================
export async function obtenerConfiguracion(): Promise<ConfiguracionServidor> {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (guardado) {
      const datos = JSON.parse(guardado) as Partial<ConfiguracionServidor>;
      
      // Validar y fusionar con valores por defecto para garantizar que existan todos los campos
      return {
        ip: datos.ip || CONFIGURACION_POR_DEFECTO.ip,
        puerto: datos.puerto || CONFIGURACION_POR_DEFECTO.puerto,
        carpeta: (datos.carpeta && datos.carpeta.trim()) || CONFIGURACION_POR_DEFECTO.carpeta,
        sincronizacionAutomatica: typeof datos.sincronizacionAutomatica === 'boolean' 
          ? datos.sincronizacionAutomatica 
          : CONFIGURACION_POR_DEFECTO.sincronizacionAutomatica,
        intervaloSincronizacion: typeof datos.intervaloSincronizacion === 'number' 
          ? datos.intervaloSincronizacion 
          : CONFIGURACION_POR_DEFECTO.intervaloSincronizacion,
      };
    }
  } catch (error) {
    console.log('Error al leer configuración:', error);
  }
  return { ...CONFIGURACION_POR_DEFECTO };
}
// ==============================================================
// FIN: obtenerConfiguracion
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarConfiguracion
// INICIO
// Propósito: Guarda la configuración completa en el almacenamiento local.
// Parámetros: configuracion (ConfiguracionServidor) - Objeto con los datos a guardar.
// Retorna: Promise<void>
// ==============================================================
export async function guardarConfiguracion(
  configuracion: ConfiguracionServidor
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CLAVE_ALMACENAMIENTO,
      JSON.stringify(configuracion)
    );
  } catch (error) {
    console.log('Error al guardar configuración:', error);
    throw error;
  }
}
// ==============================================================
// FIN: guardarConfiguracion
// ==============================================================

// ==============================================================
// FUNCIÓN: restablecerConfiguracion
// INICIO
// Propósito: Borra la configuración guardada y fuerza el uso de valores por defecto.
// Parámetros: Ninguno.
// Retorna: Promise<void>
// ==============================================================
export async function restablecerConfiguracion(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CLAVE_ALMACENAMIENTO);
  } catch (error) {
    console.log('Error al restablecer configuración:', error);
    throw error;
  }
}
// ==============================================================
// FIN: restablecerConfiguracion
// ==============================================================

// ==============================================================
// FUNCIÓN: construirUrlServidor
// INICIO
// Propósito: Genera la URL base completa para hacer fetch al servidor.
//            Ejemplo: "http://192.168.1.53:8000" o "http://192.168.1.53:8000/rumi/api/sincronizar"
// Parámetros: Ninguno.
// Retorna: Promise<string>
// ==============================================================
export async function construirUrlServidor(): Promise<string> {
  const config = await obtenerConfiguracion();
  
  // Quitar barras sobrantes al inicio y final de la carpeta
  const carpeta = config.carpeta.trim().replace(/^\/+|\/+$/g, '');
  const base = `http://${config.ip}:${config.puerto}`;
  
  return carpeta ? `${base}/${carpeta}` : base;
}
// ==============================================================
// FIN: construirUrlServidor
// ==============================================================