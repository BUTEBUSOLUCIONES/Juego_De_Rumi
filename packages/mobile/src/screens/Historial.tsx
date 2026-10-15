// UBICACIÓN: packages/mobile/src/screens/Historial.tsx
// Pantalla de Historial: listado completo de sesiones con partidas finalizadas,
// resultados, participantes, valores y contadores.
// Datos alimentados desde SesionActiva al finalizar cada partida.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// ==============================================================
// TIPOS DE NAVEGACIÓN
// ==============================================================
type RutasNavegacion = {
  Inicio: undefined;
  Historial: undefined;
};

// ==============================================================
// TIPOS DE DATOS — alineados con Sesiones y SesionActiva
// ==============================================================
type ResultadoPartida = {
  ganadorId: string;
  ganadorNombre: string;
  montoGanado: number;
};

type PartidaFinalizada = {
  id: string;
  nombre: string;
  fechaHoraFin: string;
  valorApuesta: number;
  resultado: ResultadoPartida;
  participantes: {
    id: string;
    nombre: string;
    estado: 'Activo' | 'Suspendido';
    puntaje?: number;
  }[];
};

type SesionHistorial = {
  numero: number;
  fechaHora: string;
  descripcion: string;
  valorApuestaBase: number;
  estado: 'Finalizada' | 'Archivada';
  totalPartidas: number;
  gananciasTotales: number;
  partidas: PartidaFinalizada[];
};

// ==============================================================
// FORMATEO DE FECHA
// ==============================================================
const formatearFechaHora = (fecha: Date | string): string => {
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return fecha.toString();
  const dia = f.getDate().toString().padStart(2, '0');
  const mes = (f.getMonth() + 1).toString().padStart(2, '0');
  const anio = f.getFullYear();
  const horas = f.getHours().toString().padStart(2, '0');
  const minutos = f.getMinutes().toString().padStart(2, '0');
  return `${dia}-${mes}-${anio} ${horas}h${minutos}`;
};

const formatearMonto = (valor: number): string => `$${valor.toFixed(2)}`;

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================
const Historial = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [detalleSesionAbierto, setDetalleSesionAbierto] = useState<number | null>(null);
  const [detallePartidaAbierto, setDetallePartidaAbierto] = useState<string | null>(null);

  // Datos de ejemplo — en producción se conecta al almacenamiento donde SesionActiva guarda resultados
  const [historial, setHistorial] = useState<SesionHistorial[]>([
    {
      numero: 5,
      fechaHora: '08-10-2026 19h30',
      descripcion: 'Sesión del Jueves 8 de Octubre del 2026',
      valorApuestaBase: 0.5,
      estado: 'Finalizada',
      totalPartidas: 3,
      gananciasTotales: 7.5,
      partidas: [
        {
          id: 'p5-1',
          nombre: 'Partida 1',
          fechaHoraFin: '08-10-2026 19h45',
          valorApuesta: 0.5,
          resultado: { ganadorId: '3', ganadorNombre: 'Carlos Andrade', montoGanado: 1.5 },
          participantes: [
            { id: '1', nombre: 'Ana María López', estado: 'Activo', puntaje: 12 },
            { id: '2', nombre: 'Juan Pérez', estado: 'Activo', puntaje: 15 },
            { id: '3', nombre: 'Carlos Andrade', estado: 'Activo', puntaje: 21 },
          ],
        },
        {
          id: 'p5-2',
          nombre: 'Partida 2',
          fechaHoraFin: '08-10-2026 20h10',
          valorApuesta: 0.5,
          resultado: { ganadorId: '1', ganadorNombre: 'Ana María López', montoGanado: 2.5 },
          participantes: [
            { id: '1', nombre: 'Ana María López', estado: 'Activo', puntaje: 25 },
            { id: '3', nombre: 'Carlos Andrade', estado: 'Activo', puntaje: 18 },
            { id: '4', nombre: 'Sofía Benítez', estado: 'Activo', puntaje: 14 },
            { id: '5', nombre: 'Luis Mendoza', estado: 'Activo', puntaje: 20 },
            { id: '2', nombre: 'Juan Pérez', estado: 'Suspendido', puntaje: 0 },
          ],
        },
        {
          id: 'p5-3',
          nombre: 'Partida 3',
          fechaHoraFin: '08-10-2026 20h35',
          valorApuesta: 1.0,
          resultado: { ganadorId: '4', ganadorNombre: 'Sofía Benítez', montoGanado: 3.5 },
          participantes: [
            { id: '1', nombre: 'Ana María López', estado: 'Activo', puntaje: 8 },
            { id: '4', nombre: 'Sofía Benítez', estado: 'Activo', puntaje: 30 },
            { id: '5', nombre: 'Luis Mendoza', estado: 'Activo', puntaje: 22 },
          ],
        },
      ],
    },
    {
      numero: 4,
      fechaHora: '07-10-2026 18h15',
      descripcion: 'Sesión del Miércoles 7 de Octubre del 2026',
      valorApuestaBase: 0.25,
      estado: 'Archivada',
      totalPartidas: 2,
      gananciasTotales: 1.5,
      partidas: [
        {
          id: 'p4-1',
          nombre: 'Partida 1',
          fechaHoraFin: '07-10-2026 18h40',
          valorApuesta: 0.25,
          resultado: { ganadorId: '2', ganadorNombre: 'Juan Pérez', montoGanado: 0.75 },
          participantes: [
            { id: '1', nombre: 'Ana María López', estado: 'Activo', puntaje: 10 },
            { id: '2', nombre: 'Juan Pérez', estado: 'Activo', puntaje: 18 },
            { id: '5', nombre: 'Luis Mendoza', estado: 'Activo', puntaje: 15 },
          ],
        },
        {
          id: 'p4-2',
          nombre: 'Partida 2',
          fechaHoraFin: '07-10-2026 19h05',
          valorApuesta: 0.25,
          resultado: { ganadorId: '5', ganadorNombre: 'Luis Mendoza', montoGanado: 0.75 },
          participantes: [
            { id: '2', nombre: 'Juan Pérez', estado: 'Activo', puntaje: 14 },
            { id: '5', nombre: 'Luis Mendoza', estado: 'Activo', puntaje: 20 },
            { id: '1', nombre: 'Ana María López', estado: 'Activo', puntaje: 16 },
          ],
        },
      ],
    },
  ]);

  // Filtrado y ordenamiento (más reciente primero)
  const listaFiltrada = useMemo(() => {
    let resultado = historial;
    if (textoBusqueda.trim()) {
      const busqueda = textoBusqueda.toLowerCase();
      resultado = historial.filter(
        (s) =>
          s.descripcion.toLowerCase().includes(busqueda) ||
          s.numero.toString().includes(busqueda) ||
          s.fechaHora.includes(busqueda) ||
          s.partidas.some((p) => p.nombre.toLowerCase().includes(busqueda) || p.resultado.ganadorNombre.toLowerCase().includes(busqueda))
      );
    }
    return resultado.sort((a, b) => b.numero - a.numero);
  }, [historial, textoBusqueda]);

  // Sesión seleccionada
  const sesionSeleccionada = useMemo(() => {
    return historial.find((s) => s.numero === detalleSesionAbierto) || null;
  }, [historial, detalleSesionAbierto]);

  // Partida seleccionada
  const partidaSeleccionada = useMemo(() => {
    if (!detallePartidaAbierto) return null;
    for (const sesion of historial) {
      const partida = sesion.partidas.find((p) => p.id === detallePartidaAbierto);
      if (partida) return { partida, sesionNumero: sesion.numero };
    }
    return null;
  }, [historial, detallePartidaAbierto]);

  // ============================================================
  // PANTALLA: Detalle de Partida
  // ============================================================
  if (partidaSeleccionada) {
    const { partida, sesionNumero } = partidaSeleccionada;
    return (
      <View style={estilos.pantalla}>
        <View style={estilos.contenedor}>
          <View style={estilos.cabeceraDetalle}>
            <TouchableOpacity onPress={() => setDetallePartidaAbierto(null)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={estilos.tituloDetalleCentro}>
              <Text style={estilos.tituloDetalle}>
                Sesión N°{sesionNumero} — {partida.nombre}
              </Text>
              <Text style={estilos.fechaDetalle}>Finalizada: {partida.fechaHoraFin}</Text>
              <Text style={estilos.apuestaDetalle}>Apuesta: {formatearMonto(partida.valorApuesta)}</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          {/* Tarjeta del Ganador */}
          <View style={estilos.tarjetaGanador}>
            <Ionicons name="trophy" size={24} color="#FBBF24" />
            <View style={{ marginLeft: 12 }}>
              <Text style={estilos.etiquetaGanador}>Ganador</Text>
              <Text style={estilos.nombreGanador}>{partida.resultado.ganadorNombre}</Text>
              <Text style={estilos.montoGanado}>Ganó {formatearMonto(partida.resultado.montoGanado)}</Text>
            </View>
          </View>

          {/* Lista de Participantes */}
          <Text style={estilos.subtituloSeccion}>Participantes ({partida.participantes.length})</Text>
          <FlatList
            data={partida.participantes}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={estilos.lineaFina} />}
            renderItem={({ item }) => (
              <View style={estilos.filaParticipante}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.nombreParticipante}>{item.nombre}</Text>
                  <Text style={estilos.estadoParticipante}>
                    {item.estado === 'Activo' ? 'Activo' : 'Suspendido'}
                  </Text>
                </View>
                {item.puntaje !== undefined && (
                  <View style={estilos.puntaje}>
                    <Text style={estilos.etiquetaPuntaje}>Puntos</Text>
                    <Text style={estilos.valorPuntaje}>{item.puntaje}</Text>
                  </View>
                )}
                {item.id === partida.resultado.ganadorId && (
                  <View style={estilos.insigniaGanador}>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                  </View>
                )}
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  // ============================================================
  // PANTALLA: Detalle de Sesión
  // ============================================================
  if (sesionSeleccionada) {
    return (
      <View style={estilos.pantalla}>
        <View style={estilos.contenedor}>
          <View style={estilos.cabeceraDetalle}>
            <TouchableOpacity onPress={() => setDetalleSesionAbierto(null)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={estilos.tituloDetalleCentro}>
              <Text style={estilos.tituloDetalle}>Sesión N°{sesionSeleccionada.numero}</Text>
              <Text style={estilos.fechaDetalle}>{sesionSeleccionada.fechaHora}</Text>
              <Text style={estilos.apuestaDetalle}>Apuesta base: {formatearMonto(sesionSeleccionada.valorApuestaBase)}</Text>
              <Text style={estilos.contadoresDetalle}>
                Partidas: {sesionSeleccionada.totalPartidas} | Total ganado: {formatearMonto(sesionSeleccionada.gananciasTotales)}
              </Text>
            </View>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={sesionSeleccionada.partidas}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={estilos.lineaFina} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={estilos.tarjetaPartida}
                onPress={() => setDetallePartidaAbierto(item.id)}
              >
                <View style={estilos.encabezadoPartida}>
                  <Text style={estilos.nombrePartida}>{item.nombre}</Text>
                  <Text style={estilos.fechaPartida}>{item.fechaHoraFin}</Text>
                </View>
                <View style={estilos.cuerpoPartida}>
                  <View style={estilos.infoGanador}>
                    <Ionicons name="person" size={16} color="#94A3B8" />
                    <Text style={estilos.textoGanador}>
                      {item.resultado.ganadorNombre}
                    </Text>
                  </View>
                  <View style={estilos.montoPartida}>
                    <Text style={estilos.valorGanancia}>
                      {formatearMonto(item.resultado.montoGanado)}
                    </Text>
                  </View>
                </View>
                <Text style={estilos.cantidadParticipantes}>
                  {item.participantes.length} participantes
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  }

  // ============================================================
  // PANTALLA PRINCIPAL — Listado de Sesiones
  // ============================================================
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenedor}>
        <View style={estilos.cabecera}>
          <TouchableOpacity onPress={() => navegacion.navigate('Inicio')}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={estilos.titulo}>Historial</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={estilos.contenedorBusqueda}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Buscar por sesión, partida o ganador..."
            placeholderTextColor="#94A3B8"
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
            style={estilos.entradaBusqueda}
          />
        </View>

        <View style={estilos.filaEncabezado}>
          <Text style={estilos.encN}>N°</Text>
          <Text style={estilos.encFecha}>Fecha</Text>
          <Text style={estilos.encPartidas}>Part.</Text>
          <Text style={estilos.encTotal}>Total</Text>
          <Text style={estilos.encEstado}>Estado</Text>
        </View>
        <View style={estilos.lineaCabecera} />

        <FlatList
          data={listaFiltrada}
          keyExtractor={(item) => item.numero.toString()}
          ItemSeparatorComponent={() => <View style={estilos.lineaFina} />}
          ListEmptyComponent={
            <Text style={estilos.textoVacio}>
              {textoBusqueda ? 'No hay coincidencias' : 'No hay sesiones registradas en el historial'}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={estilos.filaGrilla}
              onPress={() => setDetalleSesionAbierto(item.numero)}
            >
              <Text style={estilos.colN}>{item.numero}</Text>
              <View style={estilos.colFecha}>
                <Text style={estilos.textoFecha}>{item.fechaHora}</Text>
                <Text style={estilos.textoDescripcion} numberOfLines={1}>
                  {item.descripcion}
                </Text>
              </View>
              <Text style={estilos.colPartidas}>{item.totalPartidas}</Text>
              <Text style={estilos.colTotal}>{formatearMonto(item.gananciasTotales)}</Text>
              <View style={estilos.colEstado}>
                <View
                  style={[
                    estilos.punto,
                    { backgroundColor: item.estado === 'Finalizada' ? '#22C55E' : '#64748B' },
                  ]}
                />
                <Text style={estilos.textoEstado}>{item.estado}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

// ==============================================================
// ESTILOS — alineados con Sesiones.tsx
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenedor: {
    flex: 1,
    padding: 12,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contenedorBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  entradaBusqueda: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  filaEncabezado: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  encN: { width: 32, fontSize: 11, fontWeight: '700', color: '#CBD5E1' },
  encFecha: { flex: 2, fontSize: 11, fontWeight: '700', color: '#CBD5E1' },
  encPartidas: { width: 50, fontSize: 11, fontWeight: '700', color: '#CBD5E1', textAlign: 'center' },
  encTotal: { width: 70, fontSize: 11, fontWeight: '700', color: '#CBD5E1', textAlign: 'center' },
  encEstado: { width: 80, fontSize: 11, fontWeight: '700', color: '#CBD5E1', textAlign: 'center' },
  lineaCabecera: {
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.3)',
    marginBottom: 4,
  },
  lineaFina: {
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.12)',
    marginVertical: 1,
  },
  filaGrilla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,64,175,0.12)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  colN: { width: 32, fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  colFecha: { flex: 2 },
  textoFecha: { fontSize: 12, color: '#FFFFFF' },
  textoDescripcion: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  colPartidas: { width: 50, fontSize: 13, color: '#FFFFFF', textAlign: 'center' },
  colTotal: { width: 70, fontSize: 13, color: '#22C55E', textAlign: 'center', fontWeight: '600' },
  colEstado: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  textoEstado: {
    fontSize: 10,
    color: '#E2E8F0',
  },
  textoVacio: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 30,
    fontSize: 14,
  },
  cabeceraDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tituloDetalleCentro: {
    flex: 1,
    alignItems: 'center',
  },
  tituloDetalle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fechaDetalle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  apuestaDetalle: {
    fontSize: 13,
    color: '#22C55E',
    marginTop: 2,
  },
  contadoresDetalle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  tarjetaPartida: {
    backgroundColor: 'rgba(30,64,175,0.12)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  encabezadoPartida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nombrePartida: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fechaPartida: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cuerpoPartida: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoGanador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoGanador: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  montoPartida: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  valorGanancia: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
  },
  cantidadParticipantes: {
    fontSize: 11,
    color: '#64748B',
  },
  tarjetaGanador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  etiquetaGanador: {
    fontSize: 11,
    color: '#FBBF24',
  },
  nombreGanador: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  montoGanado: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 2,
  },
  subtituloSeccion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 10,
  },
  filaParticipante: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  nombreParticipante: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  estadoParticipante: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  puntaje: {
    alignItems: 'center',
    marginRight: 12,
  },
  etiquetaPuntaje: {
    fontSize: 10,
    color: '#64748B',
  },
  valorPuntaje: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  insigniaGanador: {
    padding: 4,
  },
});

export default Historial;