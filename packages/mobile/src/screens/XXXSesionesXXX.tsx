// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Sesiones.tsx
// Pantalla de Gestión de Sesiones: crear, listar, ver detalle y eliminar sesiones
// Mantiene orden descendente por número — formato fecha dd-mm-aaaa hhmm
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  guardarAsignacionParticipanteSesion,
  guardarSesion,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  obtenerTodosLosParticipantes,
  type ParticipanteGeneral,
} from '../servicios/BaseDatos';

// ==============================================================
// TIPOS DE NAVEGACIÓN
// ==============================================================
type RutasNavegacion = {
  Inicio: undefined;
  Sesiones: undefined;
  Participantes: undefined;
  SesionActiva: { numeroSesion?: number };
};

// ==============================================================
// TIPOS LOCALES
// ==============================================================
type SesionVista = {
  numero: number;
  fechaHora: string;
  descripcion: string;
  valorApuesta: number;
  estado: 'Activa' | 'Suspendida' | 'Finalizada';
};

type AsignacionVista = {
  sesionNumero: number;
  participanteId: string;
  nombreParticipante: string;
  estadoEnSesion: 'Activo' | 'Suspendido';
};

const VALORES_APUESTA = [0.20, 0.25, 0.50, 1.00];

// ==============================================================
// FORMATEADORES
// ==============================================================
const formatearFechaHora = (fecha: Date): string => {
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${dia}-${mes}-${anio} ${horas}${minutos}`;
};

const formatearMonto = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined) return '0.00';
  return valor.toFixed(2);
};

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================
const Sesiones = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const [listaSesiones, setListaSesiones] = useState<SesionVista[]>([]);
  const [asignacionesVista, setAsignacionesVista] = useState<AsignacionVista[]>([]);
  const [proximoNumero, setProximoNumero] = useState(1);
  const [buscarTexto, setBuscarTexto] = useState('');
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [detalleSesionAbierto, setDetalleSesionAbierto] = useState<number | null>(null);
  const [participantesRegistrados, setParticipantesRegistrados] = useState<ParticipanteGeneral[]>([]);
  const [valorApuestaSeleccionado, setValorApuestaSeleccionado] = useState<number | null>(null);
  const [valorApuestaLibre, setValorApuestaLibre] = useState('');
  const [descripcionSesion, setDescripcionSesion] = useState('');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
  const fechaActual = new Date();

  // ==============================================================
  // CARGA INICIAL DE DATOS
  // ==============================================================
  const cargarDatos = async () => {
    try {
      const participantes = await obtenerTodosLosParticipantes();
      setParticipantesRegistrados(participantes);
      const sesionesGuardadas = await obtenerSesiones();
      const mapeadas: SesionVista[] = sesionesGuardadas.map(s => ({
        numero: s.numero,
        fechaHora: s.fechaHora,
        descripcion: s.descripcion,
        valorApuesta: s.valorApuestaBase,
        estado: s.estado === 'Activa' ? 'Activa' : s.estado === 'Finalizada' ? 'Finalizada' : 'Suspendida',
      }));
      setListaSesiones(mapeadas);
      if (mapeadas.length > 0) {
        const mayor = Math.max(...mapeadas.map(s => s.numero));
        setProximoNumero(mayor + 1);
      }
    } catch (error) {
      console.log('Error cargando datos:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==============================================================
  // PARTICIPANTES ACTIVOS DISPONIBLES
  // ==============================================================
  const participantesActivos = useMemo(() => {
    return participantesRegistrados.filter(p => p.estado === 'Activo');
  }, [participantesRegistrados]);

  // ==============================================================
  // LISTA FILTRADA Y ORDENADA
  // ==============================================================
  const listaFiltrada = useMemo(() => {
    let resultado = [...listaSesiones];
    if (buscarTexto.trim() !== '') {
      const filtro = buscarTexto.toLowerCase();
      resultado = resultado.filter(
        s => s.descripcion.toLowerCase().includes(filtro) || String(s.numero).includes(filtro)
      );
    }
    return resultado.sort((a, b) => b.numero - a.numero);
  }, [listaSesiones, buscarTexto]);

  // ==============================================================
  // CARGAR DETALLE DE SESIÓN
  // ==============================================================
  const cargarDetalleSesion = async (numeroSesion: number) => {
    const asignaciones = await obtenerParticipantesPorSesion(numeroSesion);
    const mapeadas: AsignacionVista[] = asignaciones.map(a => ({
      sesionNumero: a.numeroSesion,
      participanteId: a.participanteId,
      nombreParticipante: a.nombre,
      estadoEnSesion: a.estadoEnSesion,
    }));
    setAsignacionesVista(mapeadas);
    setDetalleSesionAbierto(numeroSesion);
  };

  // ==============================================================
  // SELECCIONAR/DESELECCIONAR PARTICIPANTE
  // ==============================================================
  const alternarParticipante = (id: string) => {
    setParticipantesSeleccionados(anteriores => {
      if (anteriores.includes(id)) {
        return anteriores.filter(p => p !== id);
      }
      return [...anteriores, id];
    });
  };

  // ==============================================================
  // CREAR NUEVA SESIÓN
  // ==============================================================
  const crearSesion = async () => {
    // Determinar valor final de apuesta
    let valorApuestaFinal: number;
    if (valorApuestaSeleccionado !== null) {
      valorApuestaFinal = valorApuestaSeleccionado;
    } else {
      const parseado = parseFloat(valorApuestaLibre.replace(',', '.'));
      if (isNaN(parseado) || parseado <= 0) {
        Alert.alert('Validación', 'Ingrese un valor de apuesta válido');
        return;
      }
      valorApuestaFinal = parseado;
    }

    // Validar cantidad de participantes
    if (participantesSeleccionados.length < 3) {
      Alert.alert('Validación', 'Seleccione al menos 3 participantes');
      return;
    }

    // Guardar sesión
    await guardarSesion({
      numero: proximoNumero,
      fechaHora: formatearFechaHora(fechaActual),
      descripcion: descripcionSesion.trim() || `Sesión ${proximoNumero}`,
      valorApuestaBase: valorApuestaFinal,
      estado: 'Activa',
    });

    // Asignar participantes a la sesión
    for (const idParticipante of participantesSeleccionados) {
      const datosParticipante = participantesRegistrados.find(p => p.id === idParticipante);
      if (datosParticipante) {
        await guardarAsignacionParticipanteSesion({
          numeroSesion: proximoNumero,
          participanteId: idParticipante,
          nombre: datosParticipante.nombre,
          estadoEnSesion: 'Activo',
        });
      }
    }

    // Limpiar y recargar
    setModalCrearAbierto(false);
    setDescripcionSesion('');
    setValorApuestaSeleccionado(null);
    setValorApuestaLibre('');
    setParticipantesSeleccionados([]);
    cargarDatos();
  };

  // ==============================================================
  // ELIMINAR SESIÓN
  // ==============================================================
  const eliminarSesion = async (numero: number) => {
    const partidas = await obtenerPartidasPorSesion(numero);
    if (partidas.length > 0) {
      Alert.alert('No se puede eliminar', 'Esta sesión tiene partidas asociadas');
      return;
    }
    Alert.alert('Confirmar', `¿Eliminar la sesión Nº ${numero}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const sesiones = await obtenerSesiones();
          const filtradas = sesiones.filter(s => s.numero !== numero);
          await AsyncStorage.setItem('@Rumi/Sesiones', JSON.stringify(filtradas));
          cargarDatos();
        },
      },
    ]);
  };

  // ==============================================================
  // OBTENER COLOR DE ESTADO
  // ==============================================================
  const colorEstado = (estado: string) => {
    switch (estado) {
      case 'Activa': return '#22c55e';
      case 'Finalizada': return '#f59e0b';
      case 'Suspendida': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // ==============================================================
  // PANTALLA DE DETALLE
  // ==============================================================
  if (detalleSesionAbierto !== null) {
    const sesionActual = listaSesiones.find(s => s.numero === detalleSesionAbierto);
    return (
      <View style={estilos.pantalla}>
        <View style={estilos.cabeceraDetalle}>
          <TouchableOpacity onPress={() => setDetalleSesionAbierto(null)} style={estilos.botonVolver}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View style={estilos.informacionCabecera}>
            <Text style={estilos.tituloDetalle}>Sesión Nº {detalleSesionAbierto}</Text>
            <Text style={estilos.subtituloDetalle}>{sesionActual?.fechaHora}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setDetalleSesionAbierto(null);
              navegacion.navigate('SesionActiva', { numeroSesion: detalleSesionAbierto });
            }}
            style={estilos.botonIniciar}
          >
            <Text style={estilos.textoBotonIniciar}>Iniciar</Text>
          </TouchableOpacity>
        </View>
        <View style={estilos.contenidoDetalle}>
          <View style={estilos.tarjetaInformacion}>
            <Text style={estilos.etiquetaDetalle}>Descripción:</Text>
            <Text style={estilos.valorDetalle}>{sesionActual?.descripcion}</Text>
            <Text style={estilos.etiquetaDetalle}>Valor apuesta:</Text>
            <Text style={estilos.valorDetalle}>${formatearMonto(sesionActual?.valorApuesta)}</Text>
            <View style={estilos.contenedorEstado}>
              <Text style={estilos.etiquetaDetalle}>Estado:</Text>
              <Text style={[estilos.valorDetalle, { color: colorEstado(sesionActual?.estado || '') }]}>
                {sesionActual?.estado}
              </Text>
            </View>
          </View>
          <Text style={estilos.subtituloSeccion}>Participantes ({asignacionesVista.length})</Text>
          <FlatList
            data={asignacionesVista}
            keyExtractor={item => item.participanteId}
            ItemSeparatorComponent={() => <View style={estilos.separador} />}
            renderItem={({ item }) => (
              <View style={estilos.filaParticipanteDetalle}>
                <Text style={estilos.nombreParticipanteDetalle}>{item.nombreParticipante}</Text>
                <Text
                  style={[
                    estilos.estadoParticipanteDetalle,
                    { color: item.estadoEnSesion === 'Activo' ? '#22c55e' : '#ef4444' },
                  ]}
                >
                  {item.estadoEnSesion}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  // ==============================================================
  // PANTALLA PRINCIPAL
  // ==============================================================
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Inicio')} style={estilos.botonVolver}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Gestión de Sesiones</Text>
        <TouchableOpacity onPress={() => setModalCrearAbierto(true)} style={estilos.botonNuevo}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={estilos.contenedorBusqueda}>
        <TextInput
          placeholder="Buscar sesión..."
          placeholderTextColor="#9ca3af"
          value={buscarTexto}
          onChangeText={setBuscarTexto}
          style={estilos.entradaBusqueda}
        />
      </View>

      <View style={estilos.encabezadoTabla}>
        <Text style={estilos.columnaNumero}>Nº</Text>
        <Text style={estilos.columnaFecha}>Fecha</Text>
        <Text style={estilos.columnaDescripcion}>Descripción</Text>
        <Text style={estilos.columnaValor}>Valor</Text>
        <Text style={estilos.columnaEstado}>Estado</Text>
      </View>
      <View style={estilos.lineaSeparadoraEncabezado} />

      <FlatList
        data={listaFiltrada}
        keyExtractor={item => String(item.numero)}
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={estilos.filaSesion}
            onPress={() => cargarDetalleSesion(item.numero)}
            onLongPress={() => eliminarSesion(item.numero)}
          >
            <Text style={estilos.columnaNumero}>{item.numero}</Text>
            <Text style={estilos.columnaFecha}>{item.fechaHora}</Text>
            <Text style={estilos.columnaDescripcion} numberOfLines={1}>{item.descripcion}</Text>
            <Text style={estilos.columnaValor}>${formatearMonto(item.valorApuesta)}</Text>
            <Text style={[estilos.columnaEstado, { color: colorEstado(item.estado) }]}>
              {item.estado}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ==============================================================
          MODAL — CREAR SESIÓN
          ============================================================== */}
      <Modal visible={modalCrearAbierto} animationType="slide" onRequestClose={() => setModalCrearAbierto(false)}>
        <View style={estilos.modalFondo}>
          <View style={estilos.modalContenido}>
            <Text style={estilos.modalTitulo}>Nueva Sesión</Text>
            <ScrollView style={estilos.modalCuerpo}>
              <Text style={estilos.etiquetaFormulario}>Descripción:</Text>
              <TextInput
                value={descripcionSesion}
                onChangeText={setDescripcionSesion}
                placeholder="Nombre o descripción de la sesión"
                placeholderTextColor="#9ca3af"
                style={estilos.entradaFormulario}
              />

              <Text style={estilos.etiquetaFormulario}>Valor de apuesta base:</Text>
              <View style={estilos.contenedorValores}>
                {VALORES_APUESTA.map(valor => (
                  <TouchableOpacity
                    key={valor}
                    onPress={() => {
                      setValorApuestaSeleccionado(valor);
                      setValorApuestaLibre('');
                    }}
                    style={[
                      estilos.botonValor,
                      valorApuestaSeleccionado === valor && estilos.botonValorSeleccionado,
                    ]}
                  >
                    <Text
                      style={[
                        estilos.textoBotonValor,
                        valorApuestaSeleccionado === valor && estilos.textoValorSeleccionado,
                      ]}
                    >
                      ${valor.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={estilos.etiquetaFormulario}>O ingrese otro valor:</Text>
              <TextInput
                value={valorApuestaLibre}
                onChangeText={texto => {
                  setValorApuestaLibre(texto);
                  setValorApuestaSeleccionado(null);
                }}
                placeholder="Ej: 1.50"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                style={estilos.entradaFormulario}
              />

              <Text style={estilos.etiquetaFormulario}>
                Participantes ({participantesSeleccionados.length} seleccionados):
              </Text>
              {participantesActivos.length === 0 ? (
                <Text style={estilos.avisoSinDatos}>
                  No hay participantes activos registrados
                </Text>
              ) : (
                participantesActivos.map(participante => (
                  <TouchableOpacity
                    key={participante.id}
                    onPress={() => alternarParticipante(participante.id)}
                    style={estilos.opcionParticipante}
                  >
                    <Ionicons
                      name={participantesSeleccionados.includes(participante.id) ? 'checkbox' : 'square-outline'}
                      size={20}
                      color="#22c55e"
                    />
                    <Text style={estilos.textoOpcionParticipante}>{participante.nombre}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={estilos.modalPie}>
              <TouchableOpacity
                onPress={() => {
                  setModalCrearAbierto(false);
                  setDescripcionSesion('');
                  setValorApuestaSeleccionado(null);
                  setValorApuestaLibre('');
                  setParticipantesSeleccionados([]);
                }}
                style={estilos.botonCancelar}
              >
                <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={crearSesion} style={estilos.botonConfirmar}>
                <Text style={estilos.textoBotonConfirmar}>Crear Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  botonVolver: {
    padding: 4,
  },
  tituloPantalla: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  botonNuevo: {
    padding: 4,
  },
  contenedorBusqueda: {
    padding: 12,
    backgroundColor: '#1e293b',
  },
  entradaBusqueda: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
  },
  encabezadoTabla: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
  },
  columnaNumero: {
    width: 45,
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  columnaFecha: {
    width: 110,
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  columnaDescripcion: {
    flex: 1,
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  columnaValor: {
    width: 70,
    textAlign: 'right',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  columnaEstado: {
    width: 90,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  lineaSeparadoraEncabezado: {
    height: 1,
    backgroundColor: '#334155',
  },
  filaSesion: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  separador: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  cabeceraDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
  },
  informacionCabecera: {
    flex: 1,
    marginLeft: 10,
  },
  tituloDetalle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtituloDetalle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  botonIniciar: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  textoBotonIniciar: {
    color: '#ffffff',
    fontWeight: '700',
  },
  contenidoDetalle: {
    flex: 1,
    padding: 16,
  },
  tarjetaInformacion: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  etiquetaDetalle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  valorDetalle: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  contenedorEstado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  filaParticipanteDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  nombreParticipanteDetalle: {
    fontSize: 15,
    color: '#ffffff',
  },
  estadoParticipanteDetalle: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
  },
  modalContenido: {
    backgroundColor: '#0f172a',
    margin: 16,
    borderRadius: 12,
    maxHeight: '85%',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalCuerpo: {
    padding: 16,
  },
  etiquetaFormulario: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 16,
    marginBottom: 6,
  },
  entradaFormulario: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
  },
  contenedorValores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  botonValor: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  botonValorSeleccionado: {
    borderColor: '#22c55e',
    backgroundColor: '#134e2a',
  },
  textoBotonValor: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  textoValorSeleccionado: {
    color: '#ffffff',
  },
  avisoSinDatos: {
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 10,
  },
  opcionParticipante: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  textoOpcionParticipante: {
    color: '#ffffff',
    fontSize: 15,
  },
  modalPie: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotonCancelar: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  botonConfirmar: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotonConfirmar: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default Sesiones;