// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ConsultarSesiones.tsx
// CONSULTAR SESIONES FINALIZADAS — Lista y visualización de resultados por sesión cerrada
// Filtra solo sesiones estado = 'Finalizada' → al tocar abre ResultadosSesion con datos
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  obtenerSesiones,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerEstadisticasPorSesion,
  type Sesion,
  type EstadisticaParticipanteSesion,
} from '../servicios/BaseDatos';

type RutasNavegacion = {
  Inicio: undefined;
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
    estadisticas: EstadisticaParticipanteSesion[];
    origen?: 'Consulta' | 'SesionActiva'; // ✅ Agregado
  };
};
type SesionResumen = {
  numero: number;
  descripcion: string;
  fechaHora: string;
  valorApuestaBase: number;
  totalPartidas: number;
  partidasGanadas: number;
  partidasEmpatadas: number;
  partidasAnuladas: number;
  totalApuestas: number;
  cantidadParticipantes: number;
};
const ConsultarSesiones = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [sesionesFinalizadas, setSesionesFinalizadas] = useState<SesionResumen[]>([]);
  const formatearMonto = (v: number) => `${v >= 0 ? '$' : '-$'}${Math.abs(v).toFixed(2)}`;
  const cargarSesiones = async () => {
    setCargando(true);
    try {
      const todas = await obtenerSesiones();
      const finalizadas = todas.filter(s => s.estado === 'Finalizada');
      const resumen: SesionResumen[] = [];
      for (const sesion of finalizadas) {
        const participantes = await obtenerParticipantesPorSesion(sesion.numero);
        const partidas = await obtenerPartidasPorSesion(sesion.numero);
        resumen.push({
          numero: sesion.numero,
          descripcion: sesion.descripcion,
          fechaHora: sesion.fechaHora,
          valorApuestaBase: sesion.valorApuestaBase,
          totalPartidas: partidas.length,
          partidasGanadas: partidas.filter(p => p.estado === 'Finalizada').length,
          partidasEmpatadas: partidas.filter(p => p.estado === 'Empatada').length,
          partidasAnuladas: partidas.filter(p => p.estado === 'Anulada').length,
          totalApuestas: partidas
            .filter(p => p.estado === 'Finalizada')
            .reduce((suma, p) => suma + (p.montoGanado || 0), 0),
          cantidadParticipantes: participantes.length,
        });
      }
      setSesionesFinalizadas(resumen.sort((a, b) => b.numero - a.numero));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las sesiones');
      console.log(error);
    }
    setCargando(false);
  };
  useEffect(() => {
    cargarSesiones();
  }, []);
  const sesionesFiltradas = sesionesFinalizadas.filter(s => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      s.numero.toString().includes(termino) ||
      s.descripcion.toLowerCase().includes(termino)
    );
  });
  const verResultados = async (sesion: SesionResumen) => {
    const estadisticas = await obtenerEstadisticasPorSesion(sesion.numero);
    navegacion.navigate('ResultadosSesion', {
      numeroSesion: sesion.numero,
      descripcion: sesion.descripcion,
      valorApuesta: sesion.valorApuestaBase,
      totalPartidas: sesion.totalPartidas,
      partidasConGanador: sesion.partidasGanadas,
      partidasEmpatadas: sesion.partidasEmpatadas,
      partidasAnuladas: sesion.partidasAnuladas,
      totalApuestas: sesion.totalApuestas,
      estadisticas,
      origen: 'Consulta', // ✅ Vengo de ConsultarSesiones
    });
  };
  if (cargando) {
    return (
      <View style={estilos.pantalla}>
        <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 40 }} />
        <Text style={estilos.textoCargando}>Cargando sesiones finalizadas...</Text>
      </View>
    );
  }
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Inicio')} style={estilos.botonVolver}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Consultar Sesiones</Text>
        <TouchableOpacity onPress={cargarSesiones} style={estilos.botonRecargar}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <View style={estilos.contenedorBusqueda}>
        <Ionicons name="search" size={16} color="#94A3B8" style={{ marginLeft: 10 }} />
        <TextInput
          placeholder="Buscar por Nº o descripción..."
          placeholderTextColor="#94A3B8"
          value={busqueda}
          onChangeText={setBusqueda}
          style={estilos.entradaBusqueda}
        />
        {busqueda !== '' && (
          <TouchableOpacity onPress={() => setBusqueda('')} style={{ marginRight: 10 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
      {sesionesFinalizadas.length === 0 ? (
        <View style={estilos.vacio}>
          <Ionicons name="document-text-outline" size={60} color="#374151" />
          <Text style={estilos.textoVacio}>No hay sesiones finalizadas</Text>
          <Text style={estilos.subtextoVacio}>Finaliza una sesión desde "Gestión de Sesiones" o "Sesión Activa"</Text>
        </View>
      ) : sesionesFiltradas.length === 0 ? (
        <View style={estilos.vacio}>
          <Text style={estilos.textoVacio}>No se encontraron coincidencias</Text>
        </View>
      ) : (
        <FlatList
          data={sesionesFiltradas}
          keyExtractor={item => `sesion-${item.numero}`}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <View
              style={[
                estilos.tarjetaSesion,
                index % 2 === 1 ? estilos.filaZebra : null,
              ]}
            >
              <TouchableOpacity
                style={estilos.contenidoTarjeta}
                onPress={() => verResultados(item)}
              >
                <View style={estilos.encabezadoTarjeta}>
                  <Text style={estilos.numeroSesionTarjeta}>Sesión Nº {item.numero}</Text>
                  <View style={estilos.etiquetaFinalizada}>
                    <Text style={estilos.textoFinalizada}>Finalizada</Text>
                  </View>
                </View>
                <Text style={estilos.descripcionTarjeta} numberOfLines={1}>
                  {item.descripcion}
                </Text>
                <View style={estilos.filaDatos}>
                  <View style={estilos.dato}>
                    <Text style={estilos.etiquetaDato}>Fecha</Text>
                    <Text style={estilos.valorDato}>{item.fechaHora}</Text>
                  </View>
                  <View style={estilos.dato}>
                    <Text style={estilos.etiquetaDato}>Partidas</Text>
                    <Text style={estilos.valorDato}>{item.totalPartidas}</Text>
                  </View>
                  <View style={estilos.dato}>
                    <Text style={estilos.etiquetaDato}>Particip.</Text>
                    <Text style={estilos.valorDato}>{item.cantidadParticipantes}</Text>
                  </View>
                </View>
                <View style={estilos.filaResultados}>
                  <Text style={[estilos.etiquetaRes, { color: '#22C55E' }]}>
                    Gan: {item.partidasGanadas}
                  </Text>
                  <Text style={[estilos.etiquetaRes, { color: '#60A5FA' }]}>
                    Emp: {item.partidasEmpatadas}
                  </Text>
                  <Text style={[estilos.etiquetaRes, { color: '#F59E0B' }]}>
                    Anu: {item.partidasAnuladas}
                  </Text>
                  <Text style={[estilos.etiquetaRes, { color: '#FBBF24', fontWeight: '700' }]}>
                    {formatearMonto(item.totalApuestas)}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* ✅ Botón verde Ver Detalle */}
              <TouchableOpacity
                style={estilos.botonVerDetalle}
                onPress={() => verResultados(item)}
              >
                <Text style={estilos.textoBotonVerDetalle}>Ver Detalle</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};
const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
    padding: 12,
  },
  textoCargando: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  botonVolver: {
    padding: 4,
  },
  tituloPantalla: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonRecargar: {
    padding: 4,
  },
  contenedorBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    marginBottom: 14,
  },
  entradaBusqueda: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  textoVacio: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  subtextoVacio: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  tarjetaSesion: {
    backgroundColor: 'rgba(17,24,39,0.9)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  filaZebra: {
    backgroundColor: 'rgba(30,64,175,0.08)',
  },
  contenidoTarjeta: {
    marginBottom: 10,
  },
  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  numeroSesionTarjeta: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  etiquetaFinalizada: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  textoFinalizada: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '700',
  },
  descripcionTarjeta: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  filaDatos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dato: {
    alignItems: 'center',
  },
  etiquetaDato: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  valorDato: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  filaResultados: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99,102,241,0.15)',
  },
  etiquetaRes: {
    fontSize: 13,
    fontWeight: '600',
  },
  // ✅ Estilos para el botón verde Ver Detalle
  botonVerDetalle: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotonVerDetalle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
export default ConsultarSesiones;