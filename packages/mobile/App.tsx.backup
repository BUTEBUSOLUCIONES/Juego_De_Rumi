// D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\App.tsx
// Componente raíz de la aplicación — controla arranque, inicialización de base de datos local
// y configuración de navegación entre todas las pantallas. Sin conexión a servidor externo.
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
// Importación de pantallas del sistema
import ConsultarSesiones from './src/screens/ConsultarSesiones';
import Estadisticas from './src/screens/Estadisticas';
import GestionSesiones from './src/screens/GestionSesiones';
import Historial from './src/screens/Historial';
import PantallaInicio from './src/screens/PantallaInicio';
import Participantes from './src/screens/Participantes';
import ResultadosSesion from './src/screens/ResultadosSesion';
import SesionActiva from './src/screens/SesionActiva';
// Servicio de inicialización de base de datos local
import { inicializarBaseDatos } from './src/servicios/BaseDatos';
// Servicio de sincronización con servidor
import { sincronizarTodo } from './src/servicios/Sincronizacion';

// Definición de tipos de rutas — parámetros que puede recibir cada pantalla
type RutasApp = {
  Inicio: undefined;
  Participantes: undefined;
  GestionSesiones: undefined;
  SesionActiva: { numeroSesion?: number };
  ConsultarSesiones: undefined;
  ResultadosSesion: {
    numeroSesion: number;
    descripcion: string;
    valorApuesta: number;
    totalPartidas: number;
    partidasConGanador: number;
    partidasEmpatadas: number;
    partidasAnuladas: number;
    totalApuestas: number;
    estadisticas: Array<{
      participanteId: string;
      nombre: string;
      partidasGanadas: number;
      partidasPerdidas: number;
      valoresGanados: number;
      valoresPerdidos: number;
      saldo: number;
    }>;
  };
  Historial: undefined;
  Estadisticas: undefined;
};

// Creación del navegador principal de pila
const Navegacion = createNativeStackNavigator<RutasApp>();

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

  // Estructura de navegación principal — todas las pantallas registradas
  return (
    <NavigationContainer>
      <Navegacion.Navigator
        initialRouteName="Inicio"
        screenOptions={{
          headerStyle: { backgroundColor: '#0A1629' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0A1629' },
        }}
      >
        <Navegacion.Screen name="Inicio" component={PantallaInicio} options={{ title: 'Menú Principal' }} />
        <Navegacion.Screen name="Participantes" component={Participantes} options={{ title: 'Participantes' }} />
        <Navegacion.Screen name="GestionSesiones" component={GestionSesiones} options={{ title: 'Gestión de Sesiones' }} />
        <Navegacion.Screen name="SesionActiva" component={SesionActiva} options={{ title: 'Sesión Activa' }} />
        <Navegacion.Screen name="ConsultarSesiones" component={ConsultarSesiones} options={{ title: 'Consultar Sesiones' }} />
        <Navegacion.Screen name="ResultadosSesion" component={ResultadosSesion} options={{ title: 'Resultados de Sesión' }} />
        <Navegacion.Screen name="Historial" component={Historial} options={{ title: 'Historial' }} />
        <Navegacion.Screen name="Estadisticas" component={Estadisticas} options={{ title: 'Estadísticas' }} />
      </Navegacion.Navigator>
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