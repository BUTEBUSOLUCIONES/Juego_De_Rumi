// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\App.tsx
// Componente raíz de la aplicación — controla arranque, inicialización de base de datos local
// y configuración de navegación entre todas las pantallas. Sin conexión a servidor externo.
import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';

// Menú lateral (Drawer) con todas las pantallas
import MenuLateral from './src/navegacion/MenuLateral';

// Servicio de inicialización de base de datos local
import { inicializarBaseDatos } from './src/servicios/BaseDatos';
// Servicio de sincronización con servidor
import { sincronizarTodo } from './src/servicios/Sincronizacion';

// ==============================================================
// FUNCIÓN: App
// INICIO — Línea: 45
// Propósito: Componente principal que ejecuta el flujo de arranque:
//  1. Muestra pantalla de carga mientras inicializa la base de datos
//  2. Espera confirmación de preparación del almacenamiento local
//  3. Monta el contenedor de navegación con todas las rutas definidas
//  4. Define estilos de encabezado y comportamiento visual global
// ==============================================================
export default function App() {
  // Estado de carga durante la preparación de recursos
  const [cargando, setCargando] = useState(true);
  // Mensaje dinámico mostrado en pantalla de arranque
  const [mensajeInicio, setMensajeInicio] = useState('Preparando aplicación...');

  // ==============================================================
  // FUNCIÓN: arrancar
  // INICIO — Línea: 58
  // Propósito: Ejecuta secuencia de inicialización al montar el componente:
  //  - Llama al servicio que crea/verifica la estructura de la base de datos
  //  - Actualiza el mensaje de estado según el resultado
  //  - Retrasa ocultar pantalla de carga para experiencia visual
  // ==============================================================
  useEffect(() => {
    const arrancar = async () => {
      const resultado = await inicializarBaseDatos();
      setMensajeInicio(resultado.mensaje);
      setTimeout(() => setCargando(false), 1200);
    };
    arrancar();
  }, []);

  // ==============================================================
  // 🔄 SINCRONIZACIÓN AUTOMÁTICA — NUEVO
  // ==============================================================
  // Al iniciar la app → sincroniza
  useEffect(() => {
    sincronizarTodo();
  }, []);

  // Al volver a la app desde segundo plano → sincroniza
  useEffect(() => {
    const subscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        sincronizarTodo();
      }
    });
    return () => subscripcion.remove();
  }, []);

  // Cada 5 minutos en primer plano → revisa
  useEffect(() => {
    const intervalo = setInterval(() => {
      sincronizarTodo();
    }, 5 * 60 * 1000); // ⏱️ 5 minutos

    return () => clearInterval(intervalo);
  }, []);

  // ==============================================================
  // FIN: Sincronización
  // ==============================================================

  // Pantalla de carga — visible mientras la base de datos se prepara
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

  // Estructura de navegación principal — menú lateral con todas las pantallas
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
// ESTILOS: estilos globales de la aplicación
// Propósito: Definir apariencia visual consistente en pantallas de carga
// Colores: Fondo oscuro #0A1629 | Texto claro #FFFFFF | Indicador naranja #F59E0B
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