// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Diagnostico.tsx
// Pantalla de diagnóstico técnico de la aplicación.
// Muestra el estado del servidor, registros pendientes, última sincronización y espacio.
// Incluye manejo robusto de errores para evitar bloqueos por datos inesperados.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerDiagnosticoCompleto } from '../servicios/Diagnostico';
import { sincronizarTodo } from '../servicios/Sincronizacion';

// ==============================================================
// TIPOS
// ==============================================================
type DiagnosticoData = {
  servidor: { conectado: boolean; tiempoMs: number; url: string; mensaje: string };
  pendientes: { sesiones: number; participantes: number; participantesSesion: number; partidas: number; total: number };
  ultimaSync: { fecha: string | null; haceCuanto: string };
  espacio: { libreMB: number; totalMB: number; porcentajeLibre: number; mensaje: string };
};

// ==============================================================
// COMPONENTE: TarjetaDiagnostico
// ==============================================================
const TarjetaDiagnostico = ({
  titulo,
  icono,
  valor,
  detalle,
  estado = 'normal'
}: {
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  valor: string;
  detalle?: string;
  estado?: 'exito' | 'advertencia' | 'error' | 'normal';
}) => {
  const coloresEstado = { exito: '#22c55e', advertencia: '#f59e0b', error: '#ef4444', normal: '#3b82f6' };
  const color = coloresEstado[estado];
  
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaHeader}>
        <Ionicons name={icono} size={24} color={color} />
        <Text style={styles.tarjetaTitulo}>{titulo}</Text>
      </View>
      <Text style={[styles.tarjetaValor, { color }]}>{valor}</Text>
      {detalle && <Text style={styles.tarjetaDetalle}>{detalle}</Text>}
    </View>
  );
};

// ==============================================================
// COMPONENTE: FilaPendiente
// ==============================================================
const FilaPendiente = ({ nombre, cantidad }: { nombre: string; cantidad: number }) => (
  <View style={styles.filaPendiente}>
    <Text style={styles.filaNombre}>{nombre}</Text>
    <View style={[styles.badge, cantidad > 0 ? styles.badgeAdvertencia : styles.badgeExito]}>
      <Text style={styles.badgeTexto}>{cantidad}</Text>
    </View>
  </View>
);

// ==============================================================
// FUNCIÓN: Diagnostico
// ==============================================================
export default function Diagnostico() {
  const [datos, setDatos] = useState<DiagnosticoData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // ==============================================================
  // FUNCIÓN: cargarDiagnostico
  // ==============================================================
  const cargarDiagnostico = useCallback(async () => {
    try {
      const resultado = await obtenerDiagnosticoCompleto();
      setDatos(resultado);
    } catch (error) {
      console.error('Error cargando diagnóstico:', error);
      Alert.alert('Error', 'No se pudo cargar la información de diagnóstico.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarDiagnostico();
  }, [cargarDiagnostico]);

  // ==============================================================
  // FUNCIÓN: ejecutarSincronizacion
  // ==============================================================
  const ejecutarSincronizacion = async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarTodo();
      console.log('Resultado sync desde diagnóstico:', resultado);
      
      if (resultado.exito) {
        Alert.alert('✅ Éxito', 'Sincronización completada correctamente.');
      } else {
        Alert.alert('⚠️ Observaciones', resultado.mensaje);
      }
      
      // Recargar datos después de sincronizar
      await cargarDiagnostico();
    } catch (error) {
      console.error('Error en sync manual:', error);
      Alert.alert('❌ Error', 'Ocurrió un error inesperado durante la sincronización.');
    } finally {
      setSincronizando(false);
    }
  };

  if (cargando && !datos) {
    return (
      <View style={styles.contenedorCarga}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.textoCarga}>Recopilando información...</Text>
      </View>
    );
  }

  if (!datos) return null;

  const estadoServidor = datos.servidor.conectado ? 'exito' : 'error';
  const estadoPendientes = datos.pendientes.total > 0 ? 'advertencia' : 'exito';
  const estadoSync = datos.ultimaSync.fecha ? 'exito' : 'advertencia';
  const estadoEspacio = datos.espacio.porcentajeLibre > 20 ? 'exito' : 'advertencia';

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargarDiagnostico(); }} colors={['#3b82f6']} />
      }
    >
      <View style={styles.encabezado}>
        <Ionicons name="medkit-outline" size={32} color="#3b82f6" />
        <Text style={styles.tituloPrincipal}>Diagnóstico Técnico</Text>
        <Text style={styles.subtitulo}>Estado del sistema en tiempo real</Text>
      </View>

      <TarjetaDiagnostico
        titulo="Servidor"
        icono={datos.servidor.conectado ? 'server' : 'cloud-offline'}
        valor={datos.servidor.conectado ? 'Conectado' : 'Desconectado'}
        detalle={`${datos.servidor.mensaje} • ${datos.servidor.url}`}
        estado={estadoServidor as any}
      />

      <View style={styles.tarjeta}>
        <View style={styles.tarjetaHeader}>
          <Ionicons name="sync-circle" size={24} color={estadoPendientes === 'exito' ? '#22c55e' : '#f59e0b'} />
          <Text style={styles.tarjetaTitulo}>Registros Pendientes</Text>
          <View style={[styles.badge, datos.pendientes.total > 0 ? styles.badgeAdvertencia : styles.badgeExito]}>
            <Text style={styles.badgeTexto}>{datos.pendientes.total}</Text>
          </View>
        </View>
        <View style={styles.listaPendientes}>
          <FilaPendiente nombre="Sesiones" cantidad={datos.pendientes.sesiones} />
          <FilaPendiente nombre="Participantes" cantidad={datos.pendientes.participantes} />
          <FilaPendiente nombre="Part. en Sesión" cantidad={datos.pendientes.participantesSesion} />
          <FilaPendiente nombre="Partidas" cantidad={datos.pendientes.partidas} />
        </View>
      </View>

      <TarjetaDiagnostico
        titulo="Última Sincronización"
        icono="time"
        valor={datos.ultimaSync.haceCuanto}
        detalle={datos.ultimaSync.fecha || 'Aún no se ha sincronizado'}
        estado={estadoSync as any}
      />

      <TarjetaDiagnostico
        titulo="Almacenamiento"
        icono="hardware-chip"
        valor={`${datos.espacio.libreMB} MB libres`}
        detalle={datos.espacio.mensaje}
        estado={estadoEspacio as any}
      />

      <View style={styles.contenedorBotones}>
        <TouchableOpacity style={styles.botonPrimario} onPress={cargarDiagnostico} disabled={refrescando}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.botonTexto}>Refrescar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonPrimario, sincronizando && styles.botonDeshabilitado]}
          onPress={ejecutarSincronizacion}
          disabled={sincronizando}
        >
          {sincronizando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="cloud-upload" size={20} color="#fff" />
          )}
          <Text style={styles.botonTexto}>{sincronizando ? 'Sincronizando...' : 'Sincronizar Ahora'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ==============================================================
// ESTILOS
// ==============================================================
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f3f4f6' },
  contenido: { padding: 16 },
  contenedorCarga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  textoCarga: { marginTop: 12, fontSize: 16, color: '#6b7280' },
  encabezado: { alignItems: 'center', marginBottom: 20, paddingVertical: 16 },
  tituloPrincipal: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  subtitulo: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  tarjeta: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tarjetaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tarjetaTitulo: { fontSize: 16, fontWeight: '600', color: '#374151', marginLeft: 8, flex: 1 },
  tarjetaValor: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  tarjetaDetalle: { fontSize: 13, color: '#6b7280' },
  listaPendientes: { marginTop: 8 },
  filaPendiente: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filaNombre: { fontSize: 14, color: '#4b5563' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, minWidth: 40, alignItems: 'center' },
  badgeExito: { backgroundColor: '#dcfce7' },
  badgeAdvertencia: { backgroundColor: '#fef3c7' },
  badgeTexto: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  botonPrimario: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  botonDeshabilitado: { backgroundColor: '#9ca3af' },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '600' }
});