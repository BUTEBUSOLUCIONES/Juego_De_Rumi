// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Sincronizar.tsx
// Pantalla de sincronización con barra de progreso y resultados detallados
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ResultadoSincronizacion,
    sincronizarTodo,
} from '../servicios/Sincronizacion';

export default function Sincronizar() {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSincronizacion | null>(null);

  // ==============================================================
  // FUNCIÓN: ejecutarSincronizacion
  // Propósito: Dispara la sincronización y guarda el resultado
  // ==============================================================
  const ejecutarSincronizacion = async () => {
    setSincronizando(true);
    setResultado(null);

    try {
      const res = await sincronizarTodo();
      setResultado(res);

      // Mostrar alerta según el resultado
      if (!res.servidorDisponible) {
        Alert.alert(
          '⚠️ Servidor no disponible',
          res.mensaje,
          [{ text: 'Entendido' }]
        );
      } else if (res.exito && res.errores.length === 0) {
        Alert.alert('✅ Sincronización exitosa', res.mensaje);
      } else if (res.errores.length > 0) {
        Alert.alert('⚠️ Sincronización con errores', res.mensaje);
      }
    } catch (error) {
      const msj = 'Error inesperado: ' + String(error);
      setResultado({
        exito: false,
        mensaje: msj,
        servidorDisponible: false,
        duracionMs: 0,
        detalles: {
          sesiones: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
          participantes: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
          sesionesParticipantes: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
          partidas: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
          estadisticas: { nuevos: 0, actualizados: 0, noEnviados: 0, total: 0 },
        },
        errores: [msj],
      });
      Alert.alert('❌ Error', msj);
    } finally {
      setSincronizando(false);
    }
  };

  // ==============================================================
  // RENDER: Barra de progreso mientras sincroniza
  // ==============================================================
  if (sincronizando) {
    return (
      <View style={estilos.pantalla}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={estilos.tituloProgreso}>Sincronizando...</Text>
        <Text style={estilos.subtituloProgreso}>
          Por favor espera, no cierres la aplicación.
        </Text>
        <View style={estilos.barraProgresoFondo}>
          <View style={estilos.barraProgresoAnimada} />
        </View>
      </View>
    );
  }

  // ==============================================================
  // RENDER: Pantalla principal
  // ==============================================================
  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>Sincronización</Text>
      <Text style={estilos.descripcion}>
        Envía los datos locales al servidor y descarga las novedades.
      </Text>

      <TouchableOpacity
        style={estilos.botonPrimario}
        onPress={ejecutarSincronizacion}
        disabled={sincronizando}
      >
        <Text style={estilos.textoBoton}>🔄  Sincronizar ahora</Text>
      </TouchableOpacity>

      {resultado && (
        <View
          style={[
            estilos.tarjetaResultado,
            resultado.exito && resultado.errores.length === 0
              ? estilos.tarjetaExito
              : resultado.servidorDisponible
              ? estilos.tarjetaAdvertencia
              : estilos.tarjetaError,
          ]}
        >
          <Text style={estilos.tituloResultado}>
            {resultado.exito && resultado.errores.length === 0
              ? '✅ Éxito'
              : resultado.servidorDisponible
              ? '⚠️ Con errores'
              : '❌ Error'}
          </Text>
          <Text style={estilos.mensajeResultado}>{resultado.mensaje}</Text>
          <Text style={estilos.duracionResultado}>
            Duración: {(resultado.duracionMs / 1000).toFixed(2)}s
          </Text>

          <Text style={estilos.seccionTitulo}>Detalle por tabla:</Text>

          {Object.entries(resultado.detalles).map(([nombre, d]) => (
            <View key={nombre} style={estilos.filaDetalle}>
              <Text style={estilos.nombreTabla}>{nombre}:</Text>
              <Text style={estilos.valoresTabla}>
                ✅ {d.nuevos + d.actualizados} enviados
                {d.noEnviados > 0 ? `  |  ❌ ${d.noEnviados} fallidos` : ''}
              </Text>
            </View>
          ))}

          {resultado.errores.length > 0 && (
            <>
              <Text style={estilos.seccionTitulo}>Errores:</Text>
              {resultado.errores.map((err, i) => (
                <Text key={i} style={estilos.textoError}>
                  • {err}
                </Text>
              ))}
            </>
          )}

          <TouchableOpacity
            style={estilos.botonSecundario}
            onPress={ejecutarSincronizacion}
          >
            <Text style={estilos.textoBotonSecundario}>🔄  Reintentar</Text>
          </TouchableOpacity>
        </View>
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
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 20,
  },
  botonPrimario: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // ---- Progreso ----
  tituloProgreso: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
  },
  subtituloProgreso: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  barraProgresoFondo: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  barraProgresoAnimada: {
    width: '60%',
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  // ---- Resultado ----
  tarjetaResultado: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tarjetaExito: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22C55E',
  },
  tarjetaAdvertencia: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
  },
  tarjetaError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
  },
  tituloResultado: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  mensajeResultado: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 4,
    lineHeight: 20,
  },
  duracionResultado: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  nombreTabla: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  valoresTabla: {
    fontSize: 13,
    color: '#94A3B8',
  },
  textoError: {
    fontSize: 12,
    color: '#FCA5A5',
    marginBottom: 4,
    lineHeight: 18,
  },
  botonSecundario: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonSecundario: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});