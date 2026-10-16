// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\SesionActiva.tsx
// ✅ Versión definitiva: números reales + totales que cuadran + apuestas solo con ganador
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  actualizarParticipanteSesion,
  actualizarPartida,
  agregarHistorialParticipante,
  guardarPartida,
  guardarSesion,
  obtenerEstadisticasPorSesion,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  type EstadisticaParticipanteSesion,
  type ParticipanteEnSesion,
  type Partida,
  type Sesion,
} from '../servicios/BaseDatos';

type RutasNavegacion = {
  Inicio: undefined;
  Sesiones: undefined;
  SesionActiva: { numeroSesion?: number };
  ResultadosSesion: {
    numeroSesion: number;
    descripcion: string;
    valorApuesta: number;
    totalPartidas: number;
    partidasConGanador: number;
    partidasEmpatadas: number;
    partidasAnuladas: number;
    totalApuestasGanador: number; // ✅ Aquí también
    estadisticas: EstadisticaParticipanteSesion[];
    origen?: 'Consulta' | 'SesionActiva'; // ✅ Agregado
  };
};

type SesionDatos = {
  numero: number;
  descripcion: string;
  valorApuesta: number;
  estado: 'Activa' | 'Finalizada' | 'Cerrada';
};

type FilaResultado = {
  id: string;
  etiqueta: string;
  tipo: 'empate' | 'anulada' | 'ganador';
  participanteId?: string;
};

const SesionActiva = ({ route }: { route?: { params?: { numeroSesion?: number } } } = {}) => {
  const numeroSesion = route?.params?.numeroSesion;
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();

  const [cargando, setCargando] = useState(true);
  const [sesionBase, setSesionBase] = useState<SesionDatos | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteEnSesion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaParticipanteSesion[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filaSeleccionadaId, setFilaSeleccionadaId] = useState<string | null>(null);
  const [finalizarSesion, setFinalizarSesion] = useState(false);
  const [verEstadisticas, setVerEstadisticas] = useState(false);

  const sesionNumeroRef = useRef<number | null>(null);

  // ✅ Partida activa: la que tiene estado "EnCurso"
  const partidaActiva = useMemo(() => 
    partidas.find(p => p.estado === 'EnCurso'), 
    [partidas]
  );

  // ✅ Última partida finalizada
  const ultimaPartida = useMemo(() =>
    partidas.filter(p => p.estado !== 'EnCurso').sort((a, b) => b.numero - a.numero)[0] || null,
    [partidas]
  );

  // ✅ Mensaje del último resultado — SIN número incorrecto
  const textoUltimo = useMemo((): string | null => {
    if (!ultimaPartida) return null;
    if (ultimaPartida.estado === 'Empatada') return `Partida Anterior: Empatada`;
    if (ultimaPartida.estado === 'Anulada') return `Partida Anterior: Anulada`;
    const ganador = participantes.find(p => p.participanteId === ultimaPartida.identificadorGanador);
    const monto = ultimaPartida.montoGanado ?? 0;
    return `Partida Anterior - Ganador: ${ganador?.nombre || 'Desconocido'} — Ganó: $${monto.toFixed(2)}`;
  }, [ultimaPartida, participantes]);

  const participantesActivos = useMemo(
    () => participantes.filter(p => p.estadoEnSesion === 'Activo'),
    [participantes]
  );
  const totalActivos = participantesActivos.length;

  // ✅ CÁLCULOS QUE CUADRAN SIEMPRE
  const totales = useMemo(() => {
    const ganadas = partidas.filter(p => p.estado === 'Finalizada').length;
    const empatadas = partidas.filter(p => p.estado === 'Empatada').length;
    const anuladas = partidas.filter(p => p.estado === 'Anulada').length;
    const enCurso = partidas.filter(p => p.estado === 'EnCurso').length;
    
    // TOTAL PARTIDAS = SUMA EXACTA → G + E + A
    const totalPartidas = ganadas + empatadas + anuladas;
    
    // ✅ TOTAL APUESTAS = SOLO partidas con ganador × activos × valor
    const totalApuestas = sesionBase 
      ? ganadas * totalActivos * sesionBase.valorApuesta 
      : 0;

    return { 
      ganadas, 
      empatadas, 
      anuladas, 
      enCurso, 
      totalPartidas, 
      totalApuestas 
    };
  }, [partidas, totalActivos, sesionBase]);

  const valorPorApuesta = sesionBase ? totalActivos * sesionBase.valorApuesta : 0;

  const filasGrilla = useMemo((): FilaResultado[] => [
    { id: 'empate', etiqueta: '🤝 Empate', tipo: 'empate' },
    { id: 'anulada', etiqueta: '❌ Anulada', tipo: 'anulada' },
    ...participantesActivos.map(p => ({
      id: `ganador-${p.participanteId}`,
      etiqueta: `🏆 ${p.nombre}`,
      tipo: 'ganador' as const,
      participanteId: p.participanteId,
    })),
  ], [participantesActivos]);

  // ✅ Obtener número real desde BD
  const obtenerSiguienteNumero = useCallback(async () => {
    if (!sesionNumeroRef.current) return 1;
    const todas = await obtenerPartidasPorSesion(sesionNumeroRef.current);
    if (todas.length === 0) return 1;
    const maximo = Math.max(...todas.map(p => p.numero));
    return maximo + 1;
  }, []);

  // ✅ Recargar todo desde BD real
  const recargarTodo = useCallback(async (numeroSesionActual: number) => {
    const listaParticipantes = await obtenerParticipantesPorSesion(numeroSesionActual);
    let listaPartidas = await obtenerPartidasPorSesion(numeroSesionActual);

    // Eliminar duplicados por número
    const vistos = new Set<number>();
    listaPartidas = listaPartidas.filter(p => {
      if (vistos.has(p.numero)) return false;
      vistos.add(p.numero);
      return true;
    }).sort((a, b) => a.numero - b.numero);

    const estadisticasActuales = await obtenerEstadisticasPorSesion(numeroSesionActual);

    setParticipantes(listaParticipantes);
    setPartidas(listaPartidas);
    setEstadisticas(estadisticasActuales);

    return { listaParticipantes, listaPartidas, estadisticasActuales };
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);

    const sesionesGuardadas = await obtenerSesiones();
    let sesionActiva: Sesion | undefined;

    if (numeroSesion) {
      sesionActiva = sesionesGuardadas.find(s => s.numero === numeroSesion);
    } else {
      sesionActiva = sesionesGuardadas.filter(s => s.estado === 'Activa').sort((a, b) => b.numero - a.numero)[0];
    }

    if (!sesionActiva) {
      setCargando(false);
      Alert.alert(
        'Sin sesión activa',
        'Debe crear una sesión primero desde la opción GestionSesiones.',
        [{ text: 'Aceptar', onPress: () => navegacion.navigate('Inicio') }]
      );
      return;
    }

    sesionNumeroRef.current = sesionActiva.numero;

    await recargarTodo(sesionActiva.numero);

    setSesionBase({
      numero: sesionActiva.numero,
      descripcion: sesionActiva.descripcion,
      valorApuesta: sesionActiva.valorApuestaBase,
      estado: sesionActiva.estado === 'Finalizada' ? 'Finalizada' : 'Activa',
    });
    
    setCargando(false);
  }, [numeroSesion, navegacion, recargarTodo]);

  useFocusEffect(useCallback(() => {
    cargarDatos();
  }, [cargarDatos]));

  // ✅ Crear siguiente partida — SIN mensajes confusos
  useEffect(() => {
    if (cargando) return;
    if (!sesionBase || sesionBase.estado !== 'Activa') return;
    if (partidaActiva) return;
    if (totalActivos < 3) return;

    (async () => {
      const numeroAsignado = await obtenerSiguienteNumero();
      const nuevaPartida = await guardarPartida({
        numeroSesion: sesionBase.numero,
        numero: numeroAsignado,
        estado: 'EnCurso',
        montoGanado: 0,
        fechaHoraInicio: new Date().toISOString(),
      });
      setPartidas(prev => [...prev, nuevaPartida]);
      // ✅ NO hay mensaje de "creando partida X" que confunde
    })();
  }, [cargando, sesionBase, partidaActiva, obtenerSiguienteNumero, totalActivos]);

  const alternarParticipante = async (id: string) => {
    if (!sesionBase) return;
    const p = participantes.find(x => x.participanteId === id);
    if (!p) return;
    if (p.estadoEnSesion === 'Activo') {
      if (totalActivos <= 3) {
        Alert.alert('No permitido', 'Mínimo 3 participantes activos.');
        return;
      }
      await actualizarParticipanteSesion(sesionBase.numero, id, { estadoEnSesion: 'Suspendido' });
      setParticipantes(prev => prev.map(x =>
        x.participanteId === id ? { ...x, estadoEnSesion: 'Suspendido' as const } : x
      ));
    } else {
      await actualizarParticipanteSesion(sesionBase.numero, id, { estadoEnSesion: 'Activo' });
      setParticipantes(prev => prev.map(x =>
        x.participanteId === id ? { ...x, estadoEnSesion: 'Activo' as const } : x
      ));
    }
    setEstadisticas(await obtenerEstadisticasPorSesion(sesionBase.numero));
  };

  const abrirModal = () => {
    if (!partidaActiva) {
      Alert.alert('Sin partida en curso');
      return;
    }
    setFilaSeleccionadaId(null);
    setFinalizarSesion(false);
    setModalVisible(true);
  };

  const tocarFila = (filaId: string) => {
    setFilaSeleccionadaId(anterior => anterior === filaId ? null : filaId);
  };

  const confirmar = async () => {
    if (!partidaActiva || !sesionBase) return;

    if (!filaSeleccionadaId) {
      Alert.alert('Seleccione una opción', 'Toque una fila: Empate, Anulada o un participante.');
      return;
    }

    const fila = filasGrilla.find(f => f.id === filaSeleccionadaId);
    if (!fila) return;

    const ahora = new Date().toISOString();
    let estadoPartida: 'Finalizada' | 'Empatada' | 'Anulada';
    let ganadorId: string | undefined;
    let montoGanado = 0;

    if (fila.tipo === 'empate') {
      estadoPartida = 'Empatada';
    } else if (fila.tipo === 'anulada') {
      estadoPartida = 'Anulada';
    } else {
      estadoPartida = 'Finalizada';
      ganadorId = fila.participanteId;
      montoGanado = sesionBase.valorApuesta * (totalActivos - 1);
    }

    // ✅ Guardar resultado
    await actualizarPartida(partidaActiva.identificador!, {
      estado: estadoPartida,
      identificadorGanador: ganadorId,
      montoGanado,
      fechaHoraFinalizacion: ahora,
    });

    // ✅ Actualizar estadísticas de participantes
    if (estadoPartida === 'Finalizada' && ganadorId) {
      for (const p of participantesActivos) {
        const esGanador = p.participanteId === ganadorId;
        await actualizarParticipanteSesion(sesionBase.numero, p.participanteId, {
          partidasGanadas: p.partidasGanadas + (esGanador ? 1 : 0),
          partidasPerdidas: p.partidasPerdidas + (esGanador ? 0 : 1),
          valoresGanados: p.valoresGanados + (esGanador ? montoGanado : 0),
          valoresPerdidos: p.valoresPerdidos + (esGanador ? 0 : sesionBase.valorApuesta),
        });
        await agregarHistorialParticipante(p.participanteId, {
          numeroSesion: sesionBase.numero,
          numeroPartida: partidaActiva.numero,
          fechaHora: ahora,
          tipoResultado: esGanador ? 'Ganó' : 'Perdió',
          monto: esGanador ? montoGanado : -sesionBase.valorApuesta,
        });
      }
    } else {
      for (const p of participantesActivos) {
        await agregarHistorialParticipante(p.participanteId, {
          numeroSesion: sesionBase.numero,
          numeroPartida: partidaActiva.numero,
          fechaHora: ahora,
          tipoResultado: estadoPartida === 'Empatada' ? 'Empató' : 'Anulada',
          monto: 0,
        });
      }
    }

    // ✅ Recargar todo con números reales
    const { listaPartidas, estadisticasActuales } = await recargarTodo(sesionBase.numero);
    setModalVisible(false);

    // ✅ Cerrar sesión
    if (finalizarSesion) {
      const sesiones = await obtenerSesiones();
      const sesionEnLista = sesiones.find(s => s.numero === sesionBase.numero);
      if (sesionEnLista) {
        sesionEnLista.estado = 'Finalizada';
        await guardarSesion(sesionEnLista);
      }
      setSesionBase(prev => !prev ? null : { ...prev, estado: 'Finalizada' });
      
      // ✅ Mismos cálculos para pantalla de cierre
      const ganadasCierre = listaPartidas.filter(p => p.estado === 'Finalizada').length;
      const empatadasCierre = listaPartidas.filter(p => p.estado === 'Empatada').length;
      const anuladasCierre = listaPartidas.filter(p => p.estado === 'Anulada').length;
      const totalPartidasCierre = ganadasCierre + empatadasCierre + anuladasCierre;
      const totalApuestasCierre = ganadasCierre * totalActivos * sesionBase.valorApuesta;
      
      navegacion.navigate('ResultadosSesion', {
        numeroSesion: sesionBase.numero,
        descripcion: sesionBase.descripcion,
        valorApuesta: sesionBase.valorApuesta,
        totalPartidas: totalPartidasCierre,
        partidasConGanador: ganadasCierre,
        partidasEmpatadas: empatadasCierre,
        partidasAnuladas: anuladasCierre,
        totalApuestasGanador: totalApuestasCierre,
        estadisticas: estadisticasActuales,
      });
      return;
    }

    // ✅ Crear la siguiente partida — número real desde BD
    setTimeout(async () => {
      const siguienteNumero = await obtenerSiguienteNumero();
      const nuevaSiguiente = await guardarPartida({
        numeroSesion: sesionBase.numero,
        numero: siguienteNumero,
        estado: 'EnCurso',
        montoGanado: 0,
        fechaHoraInicio: new Date().toISOString(),
      });
      setPartidas(prev => [...prev, nuevaSiguiente]);
    }, 300);
  };

  const cerrarSesion = async () => {
    if (!sesionBase) return;
    if (partidaActiva) {
      Alert.alert('No se puede cerrar', 'Finalice la partida primero.');
      return;
    }
    Alert.alert('Cerrar Sesión', '¿Confirmar cierre y volver al Menú Principal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar', style: 'destructive', onPress: async () => {
          const sesiones = await obtenerSesiones();
          const sesionActual = sesiones.find(s => s.numero === sesionBase.numero);
          if (sesionActual) {
            sesionActual.estado = 'Finalizada';
            await guardarSesion(sesionActual);
          }
          setSesionBase(prev => !prev ? null : { ...prev, estado: 'Finalizada' });
          Alert.alert('Sesión cerrada ✅', '', [
            { text: 'Aceptar', onPress: () => navegacion.navigate('Inicio') }
          ]);
        },
      },
    ]);
  };

  const formatear = (v: number) => `${v >= 0 ? '$' : '-$'}${Math.abs(v).toFixed(2)}`;
  const colorEstado = (e: string) => e === 'Activo' ? '#22C55E' : '#F59E0B';
  const colorSaldo = (s: number) => s > 0 ? '#22C55E' : s < 0 ? '#EF4444' : '#94A3B8';

  if (cargando) return <View style={estilos.pantalla}><Text style={{color:'#fff',textAlign:'center',marginTop:40}}>Cargando...</Text></View>;
  if (!sesionBase) return <View style={estilos.pantalla}><Text style={{color:'#fff',textAlign:'center',marginTop:40}}>Cargando...</Text></View>;

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Sesiones')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={estilos.tituloCentro}>
          <Text style={estilos.tituloPrincipal}>Sesión: {sesionBase.numero}</Text>
          <Text style={estilos.descripcionSesion} numberOfLines={1}>{sesionBase.descripcion || 'Sin descripción'}</Text>
          <Text style={estilos.subtituloApuesta}>Apuesta: {formatear(sesionBase.valorApuesta)}</Text>
          {partidaActiva && (
            <View style={estilos.etiquetaActiva}>
              <Text style={estilos.textoEtiqueta}>Partida {partidaActiva.numero} en curso</Text>
            </View>
          )}
          {sesionBase.estado === 'Finalizada' && (
            <View style={estilos.etiquetaCerrada}>
              <Text style={estilos.textoEtiquetaCerrada}>Sesión Cerrada</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={cerrarSesion} disabled={sesionBase.estado === 'Finalizada'}>
          <Ionicons name="log-out" size={22} color={sesionBase.estado === 'Finalizada' ? '#4B5563' : '#EF4444'} />
        </TouchableOpacity>
      </View>

      {/* ✅ RESUMEN — TOTAL SIEMPRE CUADRA */}
      <View style={estilos.tarjetaSesion}>
        <Text style={estilos.etiquetaTarjeta}>Resumen de Sesión</Text>
        <View style={estilos.filaResumen}>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.totalPartidas}</Text>
            <Text style={estilos.etiquetaDato}>Total Partidas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.ganadas}</Text>
            <Text style={estilos.etiquetaDato}>Ganadas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.empatadas}</Text>
            <Text style={estilos.etiquetaDato}>Empatadas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.anuladas}</Text>
            <Text style={estilos.etiquetaDato}>Anuladas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{formatear(totales.totalApuestas)}</Text>
            <Text style={estilos.etiquetaDato}>Total Apuestas</Text>
          </View>
        </View>
        {/* ✅ Verificación visual: Total = G+E+A */}
        <Text style={estilos.textoVerificacion}>
          {totales.ganadas} + {totales.empatadas} + {totales.anuladas} = {totales.totalPartidas}
        </Text>
        {textoUltimo && <View style={estilos.lineaResultado}><Text style={estilos.textoResultadoFinal}>{textoUltimo}</Text></View>}
      </View>

      <TouchableOpacity style={estilos.botonEstadisticas} onPress={() => setVerEstadisticas(!verEstadisticas)}>
        <Ionicons name={verEstadisticas ? 'bar-chart' : 'bar-chart-outline'} size={18} color="#fff" />
        <Text style={estilos.textoBotonEstadisticas}>{verEstadisticas ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}</Text>
      </TouchableOpacity>

      {verEstadisticas && (
        <View style={estilos.tarjetaEstadisticas}>
          <Text style={estilos.tituloEstadisticas}>Estadísticas por Participante</Text>
          <View style={estilos.filaEncabezadoEst}>
            <Text style={estilos.encNom}>Participante</Text>
            <Text style={estilos.encNum}>G</Text>
            <Text style={estilos.encNum}>P</Text>
            <Text style={estilos.encVal}>Ganado</Text>
            <Text style={estilos.encVal}>Perdido</Text>
            <Text style={estilos.encSaldo}>Saldo</Text>
          </View>
          <View style={estilos.lineaDivisoriaEst} />
          {estadisticas.map(est => (
            <View key={est.participanteId} style={estilos.filaEstadistica}>
              <Text style={estilos.nombreEst} numberOfLines={1}>{est.nombre}</Text>
              <Text style={estilos.valNum}>{est.partidasGanadas}</Text>
              <Text style={estilos.valNum}>{est.partidasPerdidas}</Text>
              <Text style={estilos.valDin}>{formatear(est.valoresGanados)}</Text>
              <Text style={estilos.valDin}>{formatear(est.valoresPerdidos)}</Text>
              <Text style={[estilos.valSaldo, { color: colorSaldo(est.saldo) }]}>{formatear(est.saldo)}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[estilos.botonPrincipal, !partidaActiva && estilos.botonDeshabilitado]}
        onPress={abrirModal}
        disabled={!partidaActiva}
      >
        <Ionicons name="flag" size={18} color="#fff" />
        <Text style={estilos.textoBotonPrincipal}>Finalizar Partida</Text>
      </TouchableOpacity>

      <View style={estilos.filaEncabezado}>
        <Text style={estilos.encabezadoNombre}>Participante</Text>
        <Text style={estilos.encabezadoEstado}>Est</Text>
        <Text style={estilos.encabezadoNumero}>G</Text>
        <Text style={estilos.encabezadoNumero}>P</Text>
        <Text style={estilos.encabezadoValores}>Ganado</Text>
        <Text style={estilos.encabezadoValores}>Perdido</Text>
        <Text style={estilos.encabezadoApuesta}>Apuesta</Text>
        <Text style={estilos.encabezadoAcciones}></Text>
      </View>
      <View style={estilos.lineaSeparacionCabecera} />

      <FlatList
        data={participantes}
        keyExtractor={p => p.participanteId}
        ItemSeparatorComponent={() => <View style={estilos.lineaDivisoria} />}
        style={estilos.listaParticipantes}
        renderItem={({ item: p }) => {
          // ✅ Verificamos si ESTE participante es el ÚLTIMO GANADOR
          const esUltimoGanador = 
            ultimaPartida?.estado === 'Finalizada' && 
            ultimaPartida?.identificadorGanador === p.participanteId;

          return (
            <View style={[
              estilos.filaParticipante,
              esUltimoGanador && estilos.filaUltimoGanador // ← Fondo amarillo
            ]}>
              <Text style={[
                estilos.nombreFila,
                esUltimoGanador && estilos.textoUltimoGanador // ← Texto amarillo
              ]} numberOfLines={1}>
                {p.nombre}
              </Text>
              <View style={estilos.columnaEstado}>
                <View style={[estilos.puntoIndicador, { backgroundColor: colorEstado(p.estadoEnSesion) }]} />
              </View>
              <Text style={[
                estilos.columnaNumero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{p.partidasGanadas}</Text>
              <Text style={[
                estilos.columnaNumero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{p.partidasPerdidas}</Text>
              <Text style={[
                estilos.columnaValores,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{formatear(p.valoresGanados)}</Text>
              <Text style={[
                estilos.columnaValores,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{formatear(p.valoresPerdidos)}</Text>
              <Text style={[
                estilos.columnaApuesta,
                p.estadoEnSesion !== 'Activo' && estilos.textoCero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>
                {formatear(p.estadoEnSesion === 'Activo' ? sesionBase.valorApuesta : 0)}
              </Text>
              <TouchableOpacity
                style={estilos.botonFila}
                onPress={() => alternarParticipante(p.participanteId)}
                disabled={sesionBase.estado === 'Finalizada'}
              >
                <Text style={estilos.textoBotonFila}>
                  {p.estadoEnSesion === 'Activo' ? 'Susp' : 'React'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}

        
      />

      <View style={estilos.pieGrilla}>
        <Text style={estilos.textoPieGrilla}>
          Activos: {totalActivos} | Valor por partida: {formatear(valorPorApuesta)}
        </Text>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={estilos.fondoModal}>
          <View style={estilos.contenidoModal}>
            <Text style={estilos.tituloModal}>Finalizar Partida N° {partidaActiva?.numero}</Text>
            <Text style={estilos.subtituloModal}>Seleccione UNA opción tocando la fila</Text>

            <FlatList
              data={filasGrilla}
              keyExtractor={f => f.id}
              style={estilos.listaOpciones}
              renderItem={({ item }) => {
                const seleccionado = filaSeleccionadaId === item.id;
                return (
                  <TouchableOpacity
                    style={[estilos.filaOpcion, seleccionado && estilos.filaSeleccionada]}
                    onPress={() => tocarFila(item.id)}
                  >
                    <Text style={[estilos.textoFila, seleccionado && estilos.textoSeleccionado]}>
                      {seleccionado ? '✅ ' : '   '}{item.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[estilos.opcionFinalizarSesion, finalizarSesion && estilos.opcionActivaSesion]}
              onPress={() => setFinalizarSesion(prev => !prev)}
            >
              <Ionicons
                name={finalizarSesion ? 'checkbox' : 'square-outline'}
                size={20}
                color={finalizarSesion ? '#FBBF24' : '#94A3B8'}
              />
              <Text style={estilos.textoOpcionFinalizarSesion}>
                Finalizar también la Sesión
              </Text>
            </TouchableOpacity>

            <View style={estilos.filaBotonesModal}>
              <TouchableOpacity style={estilos.botonCancelar} onPress={() => setModalVisible(false)}>
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.botonConfirmar} onPress={confirmar}>
                <Text style={estilos.textoConfirmar}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1629', padding: 12 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tituloCentro: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  tituloPrincipal: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  descripcionSesion: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  subtituloApuesta: { fontSize: 13, color: '#60A5FA', marginTop: 4, fontWeight: '600' },
  etiquetaActiva: { marginTop: 4, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  textoEtiqueta: { fontSize: 10, color: '#22C55E', fontWeight: '600' },
  etiquetaCerrada: { marginTop: 4, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  textoEtiquetaCerrada: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  tarjetaSesion: { backgroundColor: 'rgba(30,64,175,0.15)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' },
  etiquetaTarjeta: { fontSize: 12, color: '#94A3B8', marginBottom: 10 },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  elementoResumen: { alignItems: 'center', minWidth: 55 },
  valorResumen: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  etiquetaDato: { fontSize: 10, color: '#64748B', marginTop: 2 },
  textoVerificacion: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 6, fontStyle: 'italic' },
  lineaResultado: { paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(96,165,250,0.15)', alignItems: 'center', marginTop: 4 },
  textoResultadoFinal: { fontSize: 14, fontWeight: '700', color: '#FBBF24' },
  botonEstadisticas: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.5)', borderRadius: 10, paddingVertical: 10, marginBottom: 10 },
  textoBotonEstadisticas: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  tarjetaEstadisticas: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  tituloEstadisticas: { fontSize: 14, fontWeight: '700', color: '#818CF8', marginBottom: 10, textAlign: 'center' },
  filaEncabezadoEst: { flexDirection: 'row', paddingBottom: 6 },
  encNom: { flex: 2, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encNum: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encVal: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encSaldo: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  lineaDivisoriaEst: { height: 1, backgroundColor: 'rgba(99,102,241,0.2)', marginBottom: 6 },
  filaEstadistica: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center' },
  nombreEst: { flex: 2, fontSize: 12, color: '#FFFFFF' },
  valNum: { width: 24, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  valDin: { width: 70, fontSize: 11, color: '#E5E7EB', textAlign: 'center' },
  valSaldo: { width: 70, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  botonPrincipal: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 10, paddingVertical: 12, marginBottom: 14 },
  botonDeshabilitado: { backgroundColor: 'rgba(100,116,139,0.3)' },
  textoBotonPrincipal: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  filaEncabezado: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 6 },
  encabezadoNombre: { flex: 2, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encabezadoEstado: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoNumero: { width: 26, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoValores: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoApuesta: { width: 60, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoAcciones: { width: 50 },
  lineaSeparacionCabecera: { height: 1, backgroundColor: 'rgba(96,165,250,0.3)', marginBottom: 4 },
  listaParticipantes: { flexGrow: 0, marginBottom: 12 },
  filaParticipante: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  nombreFila: { flex: 2, fontSize: 12, color: '#FFFFFF' },
  columnaEstado: { width: 24, alignItems: 'center' },
  puntoIndicador: { width: 7, height: 7, borderRadius: 4 },
  columnaNumero: { width: 26, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  columnaValores: { width: 70, fontSize: 11, color: '#E5E7EB', textAlign: 'center' },
  columnaApuesta: { width: 60, fontSize: 11, color: '#22C55E', textAlign: 'center', fontWeight: '600' },
  textoCero: { color: '#6B7280', fontStyle: 'italic' },
  botonFila: { width: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  textoBotonFila: { fontSize: 10, color: '#E2E8F0' },
  textoDeshabilitado: { color: '#4B5563' },
  pieGrilla: { paddingVertical: 14, paddingHorizontal: 14, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', alignItems: 'center' },
  lineaDivisoria: { height: 1, backgroundColor: '#2A3342' },
  textoPieGrilla: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 16 },
  contenidoModal: { backgroundColor: '#0F1E39', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', maxHeight: '85%' },
  tituloModal: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  subtituloModal: { fontSize: 12, color: '#94A3B8', marginBottom: 16, textAlign: 'center' },
  listaOpciones: { marginBottom: 12 },
  filaOpcion: { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'transparent' },
  filaSeleccionada: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' },
  textoFila: { fontSize: 14, color: '#CBD5E1' },
  textoSeleccionado: { color: '#FFFFFF', fontWeight: '700' },
  opcionFinalizarSesion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 8, marginBottom: 16 },
  opcionActivaSesion: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' },
  textoOpcionFinalizarSesion: { fontSize: 14, color: '#FBBF24', fontWeight: '600' },
  filaBotonesModal: { flexDirection: 'row', gap: 10 },
  botonCancelar: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoCancelar: { color: '#CBD5E1', fontWeight: '600' },
  botonConfirmar: { flex: 1, backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoConfirmar: { color: '#FFFFFF', fontWeight: '600' },
    // ✅ Estilos para el ÚLTIMO GANADOR — Fondo y texto en amarillo
  filaUltimoGanador: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)', // Fondo amarillo suave
    borderLeftWidth: 3,                          // Línea gruesa a la izquierda
    borderLeftColor: '#FBBF24',                  // Línea amarilla
  },
  textoUltimoGanador: {
    color: '#FBBF24',  // Texto en amarillo
    fontWeight: '700', // En negrita
  }
});

export default SesionActiva;