// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\RegistrosSincronizacion.tsx
// Pantalla que muestra el historial de sincronizaciones con efecto zebra, fecha de fin y mensaje destacado
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  HistorialSincronizacion,
  limpiarHistorialSincronizacion,
  obtenerHistorialSincronizacion,
} from '../servicios/BaseDatos';

export default function RegistrosSincronizacion() {
  const [registros, setRegistros] = useState<HistorialSincronizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // ==============================================================
  // FUNCIÓN: cargarRegistros
  // Propósito: Lee y ordena el historial de forma descendente (recientes primero)
  // ==============================================================
  const cargarRegistros = async () => {
    try {
      const datos = await obtenerHistorialSincronizacion();
      // Ordenar por fecha descendente (los más recientes primero)
      const ordenados = [...datos].sort(
        (a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
      );
      setRegistros(ordenados);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      await cargarRegistros();
      setCargando(false);
    };
    iniciar();
  }, []);

  const alRefrescar = async () => {
    setRefrescando(true);
    await cargarRegistros();
    setRefrescando(false);
  };

  // ==============================================================
  // FUNCIÓN: borrarAntiguos
  // ==============================================================
  const borrarAntiguos = async () => {
    await limpiarHistorialSincronizacion(7);
    await cargarRegistros();
  };

  // ==============================================================
  // FUNCIÓN AUXILIAR: formatearFecha
  // ==============================================================
  const formatearFecha = (fechaIso?: string) => {
    if (!fechaIso) return 'N/A';
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return fechaIso;
    }
  };

  // ==============================================================
  // RENDER: Cargando
  // ==============================================================
  if (cargando) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={estilos.textoCargando}>Cargando historial...</Text>
      </View>
    );
  }

  // ==============================================================
  // RENDER: Principal
  // ==============================================================
  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={alRefrescar} tintColor="#22C55E" />
      }
    >
      <Text style={estilos.titulo}>Historial de Sincronización</Text>
      <Text style={estilos.descripcion}>
        Registro de las últimas sincronizaciones. Desliza hacia abajo para actualizar.
      </Text>

      {registros.length === 0 ? (
        <View style={estilos.tarjetaVacia}>
          <Text style={estilos.textoVacio}>📭 No hay registros de sincronización.</Text>
        </View>
      ) : (
        <>
          {registros.map((registro, index) => {
            const esError = registro.estado === 'Error';
            const esProceso = registro.estado === 'En proceso';
            const esZebraPar = index % 2 === 0;

            return (
              <View
                key={registro.id || index}
                style={[
                  estilos.tarjeta,
                  esZebraPar ? estilos.tarjetaGrisClaro : estilos.tarjetaCianTenue,
                  esError
                    ? estilos.bordeError
                    : esProceso
                    ? estilos.bordeProceso
                    : estilos.bordeCorrecto,
                ]}
              >
                {/* Cabecera: Tabla y Estado */}
                <View style={estilos.filaCabecera}>
                  <Text style={estilos.nombreTabla}>
                    {esError ? '❌' : esProceso ? '⏳' : '✅'} {registro.nombreTabla}
                  </Text>
                  <Text
                    style={[
                      estilos.estado,
                      esError
                        ? estilos.estadoError
                        : esProceso
                        ? estilos.estadoProceso
                        : estilos.estadoCorrecto,
                    ]}
                  >
                    {registro.estado}
                  </Text>
                </View>

                {/* Fechas de Inicio y Fin */}
                <View style={estilos.bloqueFechas}>
                  <Text style={estilos.fecha}>
                    📅 <Text style={estilos.etiquetaCampo}>Inicio:</Text> {formatearFecha(registro.fechaInicio)}
                  </Text>
                  <Text style={estilos.fecha}>
                    🏁 <Text style={estilos.etiquetaCampo}>Fin:</Text> {formatearFecha(registro.fechaFin)}
                  </Text>
                </View>

                {/* ✅ CAMPO MENSAJE — SIEMPRE VISIBLE */}
                <View style={estilos.contenedorMensaje}>
                  <Text style={estilos.etiquetaMensaje}>Mensaje:</Text>
                  <Text style={estilos.textoMensaje}>
                    {registro.mensaje || 'Sin mensaje'}
                  </Text>
                </View>

                {/* Registros Enviados y Recibidos */}
                <View style={estilos.filaDetalle}>
                  <Text style={estilos.etiqueta}>Enviados:</Text>
                  <Text style={estilos.valor}>{registro.registrosEnviados ?? 0}</Text>
                </View>
                <View style={estilos.filaDetalle}>
                  <Text style={estilos.etiqueta}>Recibidos:</Text>
                  <Text style={estilos.valor}>{registro.registrosRecibidos ?? 0}</Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={estilos.botonBorrar} onPress={borrarAntiguos}>
            <Text style={estilos.textoBotonBorrar}>🧹  Borrar registros con más de 7 días</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  centrado: {
    flex: 1,
    backgroundColor: '#0A1629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCargando: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 19,
  },
  tarjetaVacia: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  textoVacio: {
    color: '#94A3B8',
    fontSize: 14,
  },
  tarjeta: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  tarjetaGrisClaro: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tarjetaCianTenue: {
    backgroundColor: 'rgba(6, 182, 212, 0.07)',
  },
  bordeCorrecto: {
    borderLeftColor: '#22C55E',
  },
  bordeError: {
    borderLeftColor: '#EF4444',
  },
  bordeProceso: {
    borderLeftColor: '#F59E0B',
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nombreTabla: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  estado: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  estadoCorrecto: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    color: '#86EFAC',
  },
  estadoError: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    color: '#FCA5A5',
  },
  estadoProceso: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    color: '#FCD34D',
  },
  bloqueFechas: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  fecha: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 2,
  },
  etiquetaCampo: {
    fontWeight: '600',
    color: '#94A3B8',
  },
  contenedorMensaje: {
    marginVertical: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#06B6D4',
  },
  etiquetaMensaje: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textoMensaje: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  etiqueta: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  valor: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  botonBorrar: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonBorrar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});