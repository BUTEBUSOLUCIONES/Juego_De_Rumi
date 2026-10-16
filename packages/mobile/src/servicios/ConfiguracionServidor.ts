// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\ConfiguracionServidor.ts
// Servicio de configuración del servidor
// Guarda y lee IP, puerto y carpeta del proyecto desde el almacenamiento local
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
// Propósito: Estructura de los datos del servidor
// ==============================================================
export type ConfiguracionServidor = {
  ip: string;
  puerto: string;
  carpeta: string;
};

// ==============================================================
// VALORES POR DEFECTO
// Propósito: Configuración inicial si no existe nada guardado
// ==============================================================
const CONFIGURACION_POR_DEFECTO: ConfiguracionServidor = {
  ip: '192.168.1.53',
  puerto: '8000',
  carpeta: '/api/sincronizar/',
};

// ==============================================================
// FUNCIÓN: obtenerConfiguracion
// Propósito: Lee la configuración guardada o devuelve la por defecto
// ==============================================================
export async function obtenerConfiguracion(): Promise<ConfiguracionServidor> {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (guardado) {
      const datos = JSON.parse(guardado) as ConfiguracionServidor;
      // Validar que tenga los campos mínimos
      return {
        ip: datos.ip || CONFIGURACION_POR_DEFECTO.ip,
        puerto: datos.puerto || CONFIGURACION_POR_DEFECTO.puerto,
        carpeta: datos.carpeta || CONFIGURACION_POR_DEFECTO.carpeta,
      };
    }
  } catch (error) {
    console.log('Error al leer configuración:', error);
  }
  return { ...CONFIGURACION_POR_DEFECTO };
}

// ==============================================================
// FUNCIÓN: guardarConfiguracion
// Propósito: Guarda la configuración en el almacenamiento local
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
// FUNCIÓN: restablecerConfiguracion
// Propósito: Borra la configuración y vuelve a los valores por defecto
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
// FUNCIÓN: construirUrlServidor
// Propósito: Genera la URL base completa para hacer fetch
// Ejemplo: "http://192.168.1.53:8000" o "http://192.168.1.53:8000/rumi"
// ==============================================================
export async function construirUrlServidor(): Promise<string> {
  const config = await obtenerConfiguracion();
  const carpeta = config.carpeta.trim().replace(/^\/+|\/+$/g, ''); // quitar slashes
  const base = `http://${config.ip}:${config.puerto}`;
  return carpeta ? `${base}/${carpeta}` : base;
}