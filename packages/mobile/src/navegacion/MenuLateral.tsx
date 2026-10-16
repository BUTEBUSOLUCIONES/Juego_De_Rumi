// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\navegacion\MenuLateral.tsx
// Menú lateral (Drawer) con todas las opciones de la aplicación
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importación de pantallas
import ConfiguracionServidor from '../screens/ConfiguracionServidor';
import ConsultarSesiones from '../screens/ConsultarSesiones';
import Estadisticas from '../screens/Estadisticas';
import GestionSesiones from '../screens/GestionSesiones';
import Historial from '../screens/Historial';
import PantallaInicio from '../screens/PantallaInicio';
import Participantes from '../screens/Participantes';
import RegistrosSincronizacion from '../screens/RegistrosSincronizacion';
import ResultadosSesion from '../screens/ResultadosSesion';
import SesionActiva from '../screens/SesionActiva';
import Sincronizar from '../screens/Sincronizar';

// Definición de rutas del menú
type RutasMenu = {
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
  Sincronizar: undefined;
  RegistrosSincronizacion: undefined;
  ConfiguracionServidor: undefined;
};

const Menu = createDrawerNavigator<RutasMenu>();

// ==============================================================
// COMPONENTE: MenuLateral
// Propósito: Menú lateral con todas las pantallas + opción Sincronizar
// ==============================================================
export default function MenuLateral() {
  return (
    <Menu.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerStyle: { backgroundColor: '#0A1629' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        drawerStyle: {
          backgroundColor: '#0A1629',
          width: 260,
        },
        drawerActiveTintColor: '#22C55E',
        drawerInactiveTintColor: '#CBD5E1',
        drawerActiveBackgroundColor: 'rgba(34, 197, 94, 0.15)',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '600',
        },
      }}
    >
      <Menu.Screen
        name="Inicio"
        component={PantallaInicio}
        options={{ title: 'Menú Principal', drawerLabel: '🏠  Inicio' }}
      />
      <Menu.Screen
        name="Participantes"
        component={Participantes}
        options={{ title: 'Participantes', drawerLabel: '👥  Participantes' }}
      />
      <Menu.Screen
        name="GestionSesiones"
        component={GestionSesiones}
        options={{ title: 'Gestión de Sesiones', drawerLabel: '📋  Gestión de Sesiones' }}
      />
      <Menu.Screen
        name="SesionActiva"
        component={SesionActiva}
        options={{ title: 'Sesión Activa', drawerLabel: '🎮  Sesión Activa' }}
      />
      <Menu.Screen
        name="ConsultarSesiones"
        component={ConsultarSesiones}
        options={{ title: 'Consultar Sesiones', drawerLabel: '🔍  Consultar Sesiones' }}
      />
      <Menu.Screen
        name="ResultadosSesion"
        component={ResultadosSesion}
        options={{ title: 'Resultados de Sesión', drawerLabel: '📊  Resultados' }}
      />
      <Menu.Screen
        name="Historial"
        component={Historial}
        options={{ title: 'Historial', drawerLabel: '📚  Historial' }}
      />
      <Menu.Screen
        name="Estadisticas"
        component={Estadisticas}
        options={{ title: 'Estadísticas', drawerLabel: '📈  Estadísticas' }}
      />
      <Menu.Screen
        name="Sincronizar"
        component={Sincronizar}
        options={{ title: 'Sincronizar', drawerLabel: '🔄  Sincronizar' }}
      />
      <Menu.Screen
        name="RegistrosSincronizacion"
        component={RegistrosSincronizacion}
        options={{ title: 'Registros de Sincronización', drawerLabel: '📋  Registros Sync' }}
      />
      <Menu.Screen
        name="ConfiguracionServidor"
        component={ConfiguracionServidor}
        options={{ title: 'Configuración del Servidor', drawerLabel: '⚙️  Configuración' }}
        />
      </Menu.Navigator>
  );
}