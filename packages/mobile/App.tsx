// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\App.tsx
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 17/10/2026  | 1.0.0   | Versión inicial del componente raíz App.tsx. |
// | 22/10/2026  | 1.1.0   | Ajuste de documentación y formato de comentarios según reglas del proyecto. |
// | 22/10/2026  | 1.2.0   | Integración de la sincronización periódica basada en la configuración del servidor (activación e intervalo). |

// Componente raíz de la aplicación.
// Garantiza que la base de datos SQLite se inicialice COMPLETAMENTE 
// antes de permitir cualquier operación de sincronización.

import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

// Menú lateral (Drawer) con todas las pantallas
import MenuLateral from './src/navegacion/MenuLateral';

// Servicio de inicialización de base de datos local (SQLite)
import { inicializarBaseDatosSQLite } from './src/servicios/ConexionSQLite';

// Servicio de sincronización con servidor
import { sincronizarTodo } from './src/servicios/Sincronizacion';

// Servicio de visualización de contenido de la base de datos
import { verTodaLaBase } from './src/servicios/VerBaseDatos';

// Servicio de configuración del servidor
import { obtenerConfiguracion } from './src/servicios/ConfiguracionServidor';

// ==============================================================
// FUNCIÓN: App
// INICIO
// Propósito: Componente raíz de la aplicación. Garantiza que la base de datos 
//            SQLite se inicialice completamente antes de permitir cualquier 
//            operación de sincronización o navegación.
// Parámetros: Ninguno.
// Retorna: JSX.Element (Pantalla de carga o NavigationContainer con MenuLateral).
// ==============================================================
export default function App() {
  const [cargando, setCargando] = useState(true);
  const [mensajeInicio, setMensajeInicio] = useState('Preparando aplicación...');
  
  // Usamos useRef para evitar que los efectos se disparen múltiples veces
  const appIsReady = useRef(false);

  // ==============================================================
  // EFECTO: Inicialización estricta y secuencial
  // INICIO
  // Propósito: Ejecutar la secuencia de arranque: DB -> Verificación -> Sync.
  // ==============================================================
  useEffect(() => {
    const arrancar = async () => {
      if (appIsReady.current) return; // Evitar doble ejecución
      
      setMensajeInicio('Inicializando base de datos local...');
      
      // 1. Esperar a que la base de datos esté 100% lista
      const resultado = await inicializarBaseDatosSQLite();
      
      if (resultado.exito) {
        setMensajeInicio('Base de datos lista. Consultando registros...');
        
        // ✅ Mostrar contenido de todas las tablas en consola
        await verTodaLaBase();
        
        setMensajeInicio('Sincronizando datos...');
        
        // 2. SOLO AHORA ejecutamos la primera sincronización
        await sincronizarTodo();
        
        setMensajeInicio('¡Aplicación lista!');
        appIsReady.current = true;
      } else {
        setMensajeInicio(`Error: ${resultado.mensaje}`);
      }
      
      // 3. Pequeña pausa para que el usuario vea el mensaje
      setTimeout(() => setCargando(false), 800);
    };
    
    arrancar();
  }, []);
  // ==============================================================
  // FIN: Inicialización estricta
  // ==============================================================

  // ==============================================================
  // EFECTO: Sincronización al volver a primer plano
  // INICIO
  // Propósito: Sincronizar datos automáticamente cuando la app recupera el foco.
  // ==============================================================
  useEffect(() => {
    if (!appIsReady.current) return; // No hacer nada si aún no está lista
    
    const subscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        console.log('🔄 App volvió a primer plano. Sincronizando...');
        sincronizarTodo();
      }
    });
    
    return () => {
      subscripcion.remove();
    };
  }, []);
  // ==============================================================
  // FIN: Sincronización al volver a primer plano
  // ==============================================================

  // ==============================================================
  // EFECTO: Sincronización periódica basada en configuración
  // INICIO
  // Propósito: Mantener los datos actualizados en segundo plano según el 
  //            intervalo configurado por el usuario, si la opción está activa.
  // ==============================================================
  useEffect(() => {
    if (!appIsReady.current) return; // No hacer nada si aún no está lista

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const configurarSincronizacionPeriodica = async () => {
      const config = await obtenerConfiguracion();
      
      if (config.sincronizacionAutomatica) {
        const milisegundos = config.intervaloSincronizacion * 60 * 1000;
        console.log(`⏱️ Sincronización periódica activada: cada ${config.intervaloSincronizacion} minutos.`);
        
        intervalo = setInterval(() => {
          console.log('🔄 Ejecutando sincronización periódica...');
          sincronizarTodo();
        }, milisegundos);
      } else {
        console.log('⏸️ Sincronización periódica desactivada por configuración del usuario.');
      }
    };

    configurarSincronizacionPeriodica();

    return () => {
      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, []);
  // ==============================================================
  // FIN: Sincronización periódica basada en configuración
  // ==============================================================

  // ==============================================================
  // RENDERIZADO: Pantalla de carga
  // ==============================================================
  if (cargando) {
    return (
      <View style={estilos.pantallaCarga}>
        <ActivityIndicator size="large" color="#22C55E" style={{ marginBottom: 16 }} />
        <Text style={estilos.titulo}>Partidas de Rumi</Text>
        <Text style={estilos.mensaje}>{mensajeInicio}</Text>
        <View style={estilos.indicadorEstado}>
          <View style={estilos.puntoSinConexion} />
          <Text style={estilos.textoEstado}>Modo sin conexión — Datos locales</Text>
        </View>
      </View>
    );
  }

  // ==============================================================
  // RENDERIZADO: Navegación principal
  // ==============================================================
  return (
    <NavigationContainer>
      <MenuLateral />
    </NavigationContainer>
  );
}
// ==============================================================
// FIN: App
// ==============================================================

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantallaCarga: {
    flex: 1,
    backgroundColor: '#0A1629',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  indicadorEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  puntoSinConexion: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  textoEstado: {
    fontSize: 13,
    color: '#CBD5E1',
  },
});