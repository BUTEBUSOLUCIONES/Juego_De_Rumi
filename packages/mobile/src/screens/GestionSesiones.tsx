// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\GestorSesiones.tsx
// Pantalla de Gestión de Sesiones — Crear, listar, ver detalle y eliminar sesiones
// Formato fecha: dd-mm-aaaa hhmm | Encabezado fecha: "Sesión del Día Nombre de Mes del Año"
// Estilo de grilla: filas alternas (zebra) | Estado en color blanco | Columna Part. = cantidad de participantes
// REGLA: Solo puede existir UNA sesión activa a la vez
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
  cantidadParticipantes: number;
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
  return `${dia}-${mes}-${anio} ${horas}h${minutos}`;
};

const formatearDescripcionSesion = (fecha: Date): string => {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const nombreDia = diasSemana[fecha.getDay()];
  const dia = fecha.getDate();
  const nombreMes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  return `Sesión del ${nombreDia} ${dia} de ${nombreMes} del ${anio}`;
};

const formatearMonto = (valor: number | null | undefined): string => {
  if (valor === null || valor === undefined) return '0.00';
  return valor.toFixed(2);
};

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================
const GestorSesiones = () => {
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
  // CARGA INICIAL DE DATOS — desde base local con cantidad de participantes
  // ==============================================================
  const cargarDatos = async () => {
    try {
      const participantes = await obtenerTodosLosParticipantes();
      setParticipantesRegistrados(participantes);
      const sesionesGuardadas = await obtenerSesiones();

      const mapeadas: SesionVista[] = [];
      for (const s of sesionesGuardadas) {
        const asignaciones = await obtenerParticipantesPorSesion(s.numero);
        mapeadas.push({
          numero: s.numero,
          fechaHora: s.fechaHora,
          descripcion: s.descripcion,
          valorApuesta: s.valorApuestaBase,
          estado: s.estado === 'Activa' ? 'Activa' : s.estado === 'Finalizada' ? 'Finalizada' : 'Suspendida',
          cantidadParticipantes: asignaciones.length,
        });
      }

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
  // ✅ NUEVA REGLA: Detectar si ya existe una sesión activa
  // Propósito: Solo puede existir una sesión activa a la vez
  // ==============================================================
  const sesionActivaExistente = useMemo(() => {
    return listaSesiones.find((s) => s.estado === 'Activa') || null;
  }, [listaSesiones]);

  const haySesionActiva = sesionActivaExistente !== null;

  // ==============================================================
  // PARTICIPANTES ACTIVOS DISPONIBLES
  // ==============================================================
  const participantesActivos = useMemo(() => {
    return participantesRegistrados.filter(p => p.estado === 'Activo');
  }, [participantesRegistrados]);

  // ==============================================================
  // LISTA FILTRADA Y ORDENADA — descendente por número
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
  // ✅ NUEVA FUNCIÓN: intentarCrearSesion
  // Propósito: Valida si se puede abrir el modal de crear sesión
  // ==============================================================
  const intentarCrearSesion = () => {
    if (haySesionActiva && sesionActivaExistente) {
      Alert.alert(
        '⚠️ Sesión activa en curso',
        `Ya existe la Sesión Nº ${sesionActivaExistente.numero} activa.\n\nDebes finalizarla o suspenderla antes de crear una nueva.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    setModalCrearAbierto(true);
  };

  // ==============================================================
  // CREAR NUEVA SESIÓN
  // ==============================================================
  const crearSesion = async () => {
    // ✅ VALIDACIÓN EXTRA: Verificar nuevamente antes de guardar
    if (haySesionActiva) {
      Alert.alert('Validación', 'Ya existe una sesión activa. Finalícela antes de crear otra.');
      return;
    }

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

    if (participantesSeleccionados.length < 3) {
      Alert.alert('Validación', 'Seleccione al menos 3 participantes');
      return;
    }
    if (participantesSeleccionados.length > 5) {
      Alert.alert('Validación', 'No se permiten más de 5 participantes');
      return;
    }

    const descripcionFinal = descripcionSesion.trim() || formatearDescripcionSesion(fechaActual);

    await guardarSesion({
      numero: proximoNumero,
      fechaHora: formatearFechaHora(fechaActual),
      descripcion: descripcionFinal,
      valorApuestaBase: valorApuestaFinal,
      estado: 'Activa',
    });

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
  // COLOR DE ESTADO
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
            <Text style={estilos.etiquetaDetalle}>Participantes:</Text>
            <Text style={estilos.valorDetalle}>{sesionActual?.cantidadParticipantes}</Text>
            <View style={estilos.contenedorEstado}>
              <Text style={estilos.etiquetaDetalle}>Estado:</Text>
              <Text style={[estilos.valorDetalle, estilos.textoEstadoBlanco]}>
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
  // PANTALLA PRINCIPAL — Con columna Part. y validación de sesión única
  // ==============================================================
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Inicio')} style={estilos.botonVolver}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Gestión de Sesiones</Text>
        {/* ✅ BOTÓN BLOQUEADO si hay sesión activa */}
        <TouchableOpacity
          onPress={intentarCrearSesion}
          style={[
            estilos.botonCrearSesion,
            haySesionActiva && estilos.botonCrearSesionBloqueado,
          ]}
          disabled={haySesionActiva}
        >
          <Ionicons
            name={haySesionActiva ? 'lock-closed' : 'add-circle'}
            size={20}
            color="#ffffff"
          />
          <Text style={estilos.textoBotonCrear}>
            {haySesionActiva ? 'Bloqueado' : 'Crear Sesión'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ AVISO ROJO cuando hay sesión activa */}
      {haySesionActiva && sesionActivaExistente && (
        <View style={estilos.avisoSesionActiva}>
          <Ionicons name="warning" size={18} color="#FCA5A5" />
          <Text style={estilos.textoAvisoSesionActiva}>
            Sesión Nº {sesionActivaExistente.numero} activa. Finalízala para crear otra.
          </Text>
        </View>
      )}

      <View style={estilos.contenedorBusqueda}>
        <TextInput
          placeholder="Buscar sesión..."
          placeholderTextColor="#9ca3af"
          value={buscarTexto}
          onChangeText={setBuscarTexto}
          style={estilos.entradaBusqueda}
        />
      </View>

      {/* ✅ ENCABEZADO CON COLUMNA Part. */}
      <View style={estilos.encabezadoTabla}>
        <Text style={estilos.columnaNumero}>Nº</Text>
        <Text style={estilos.columnaFecha}>Fecha</Text>
        <Text style={estilos.columnaDescripcion}>Descripción</Text>
        <Text style={estilos.columnaPart}>Part.</Text>
        <Text style={estilos.columnaValor}>Valor</Text>
        <Text style={[estilos.columnaEstado, estilos.textoEstadoBlanco]}>Estado</Text>
      </View>
      <View style={estilos.lineaSeparadoraEncabezado} />

      {/* ✅ FILAS CON CANTIDAD DE PARTICIPANTES */}
      <FlatList
        data={listaFiltrada}
        keyExtractor={item => String(item.numero)}
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              estilos.filaSesion,
              index % 2 === 0 ? estilos.filaPar : estilos.filaImpar,
            ]}
            onPress={() => cargarDetalleSesion(item.numero)}
            onLongPress={() => eliminarSesion(item.numero)}
          >
            <Text style={estilos.columnaNumero}>{item.numero}</Text>
            <Text style={estilos.columnaFecha}>{item.fechaHora}</Text>
            <Text style={estilos.columnaDescripcion} numberOfLines={1}>{item.descripcion}</Text>
            <Text style={estilos.columnaPart}>{item.cantidadParticipantes}</Text>
            <Text style={estilos.columnaValor}>${formatearMonto(item.valorApuesta)}</Text>
            <Text style={[estilos.columnaEstado, estilos.textoEstadoBlanco]}>
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
                placeholder={`Predeterminado: ${formatearDescripcionSesion(fechaActual)}`}
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
// ESTILOS — con nuevos estilos para el bloqueo
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
  botonCrearSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  // ✅ NUEVO: Estilo cuando el botón está bloqueado
  botonCrearSesionBloqueado: {
    backgroundColor: '#6b7280',
    opacity: 0.6,
  },
  textoBotonCrear: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // ✅ NUEVO: Aviso cuando hay sesión activa
  avisoSesionActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textoAvisoSesionActiva: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
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
    width: 120,
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
  columnaPart: {
    width: 60,
    textAlign: 'center',
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
  textoEstadoBlanco: {
    color: '#ffffff',
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
  filaPar: {
    backgroundColor: '#0f172a',
  },
  filaImpar: {
    backgroundColor: '#1e293b',
  },
  separador: {
    height: 1,
    backgroundColor: '#334155',
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

export default GestorSesiones;