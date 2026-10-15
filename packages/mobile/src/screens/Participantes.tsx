// D:\PROYECTOS_2026\PROYECTOS_VS\RUMI\App_Rumi\packages\mobile\src\screens\Participantes.tsx
// Pantalla de Gestión de Participantes: permite crear, editar, eliminar, buscar y
// visualizar participantes con validaciones de nombre único y estados definidos.
// La grilla se mantiene ordenada alfabéticamente en todo momento.
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { 
  guardarParticipanteGeneral, 
  obtenerTodosLosParticipantes,
  type ParticipanteGeneral 
} from '../servicios/BaseDatos';

type EstadoParticipante = 'Activo' | 'Suspendido' | 'Inactivo';

type Participante = {
  id: string;
  nombre: string;
  estado: EstadoParticipante;
};

const Participantes = () => {
  const navegacion = useNavigation();
  const [lista, setLista] = useState<Participante[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const datosGuardados = await obtenerTodosLosParticipantes();
      setLista(datosGuardados.map(p => ({
        id: p.id,  // ✅ Corregido: usa 'id' directamente
        nombre: p.nombre,
        estado: p.estado,
      })));
    };
    cargarDatos();
  }, []);

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [idEditar, setIdEditar] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState<EstadoParticipante>('Activo');

  const listaFiltrada = useMemo(() => {
    let resultado = lista;
    if (textoBusqueda.trim()) {
      const busqueda = textoBusqueda.toLowerCase();
      resultado = lista.filter(elemento =>
        elemento.nombre.toLowerCase().includes(busqueda)
      );
    }
    return resultado.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, undefined, { sensitivity: 'base' })
    );
  }, [lista, textoBusqueda]);

  const limpiarFormulario = () => {
    setNombre('');
    setEstado('Activo');
    setIdEditar(null);
    setModalVisible(false);
  };

  const abrirModalNuevo = () => {
    limpiarFormulario();
    setModalVisible(true);
  };

  const abrirModalEditar = (elemento: Participante) => {
    setIdEditar(elemento.id);
    setNombre(elemento.nombre);
    setEstado(elemento.estado);
    setModalVisible(true);
  };

  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      Alert.alert('Aviso', 'El nombre completo es obligatorio.');
      return;
    }
    const patronSoloLetras = /^[A-Za-zÁáÉéÍíÓóÚúÑñ ]+$/;
    if (!patronSoloLetras.test(nombreLimpio)) {
      Alert.alert(
        'Aviso',
        'El nombre solo puede contener letras y espacios.\nNo se permiten números ni símbolos.'
      );
      return;
    }
    const nombreDuplicado = lista.some(
      elemento =>
        elemento.nombre.toLowerCase() === nombreLimpio.toLowerCase() &&
        elemento.id !== idEditar
    );
    if (nombreDuplicado) {
      Alert.alert('Aviso', 'Ya existe un participante con ese nombre.\nDebe ser único.');
      return;
    }

    if (idEditar) {
      // Edición: actualizar en memoria y guardar
      const listaActualizada = lista.map(elemento =>
        elemento.id === idEditar
          ? { ...elemento, nombre: nombreLimpio, estado }
          : elemento
      );
      setLista(listaActualizada);
      // Para edición, guardamos reemplazando el registro
      await guardarParticipanteGeneral({
        id: idEditar,
        nombre: nombreLimpio,
        estado,
      });
    } else {
      // Nuevo: guardar y agregar a lista
      const nuevo = await guardarParticipanteGeneral({
        nombre: nombreLimpio,
        estado,
      });
      setLista([nuevo, ...lista]);
    }

    limpiarFormulario();
  };

  const eliminar = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Desea eliminar este participante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setLista(lista.filter(elemento => elemento.id !== id)),
        },
      ]
    );
  };

  const obtenerColorEstado = (valor: EstadoParticipante) => {
    switch (valor) {
      case 'Activo': return '#22C55E';
      case 'Suspendido': return '#F59E0B';
      case 'Inactivo': return '#EF4444';
    }
  };

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenedor}>
        <View style={estilos.cabecera}>
          <TouchableOpacity onPress={() => navegacion.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={estilos.titulo}>Participantes</Text>
          <View style={{ width: 24 }} />
        </View>

        <TouchableOpacity style={estilos.botonAdicionar} onPress={abrirModalNuevo}>
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={estilos.textoAdicionar}>Adicionar Participante</Text>
        </TouchableOpacity>

        <View style={estilos.contenedorBusqueda}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Buscar por nombre..."
            placeholderTextColor="#94A3B8"
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
            style={estilos.entradaBusqueda}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={estilos.filaEncabezado}>
          <Text style={estilos.encabezadoNombre}>Nombre</Text>
          <Text style={estilos.encabezadoEstado}>Estado</Text>
          <Text style={estilos.encabezadoAcciones}></Text>
        </View>
        <View style={estilos.lineaSeparadoraCabecera} />

        <FlatList
          data={listaFiltrada}
          keyExtractor={elemento => elemento.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={estilos.lineaEntreFilas} />}
          ListEmptyComponent={
            <Text style={estilos.textoVacio}>
              {textoBusqueda
                ? 'No hay coincidencias'
                : 'No hay participantes registrados'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={estilos.filaGrilla}>
              <Text style={estilos.textoNombre} numberOfLines={1}>
                {item.nombre}
              </Text>
              <View style={estilos.cajaEstado}>
                <View
                  style={[estilos.puntoEstado, { backgroundColor: obtenerColorEstado(item.estado) }]}
                />
                <Text style={estilos.textoEstado}>{item.estado}</Text>
              </View>
              <View style={estilos.botonesFila}>
                <TouchableOpacity
                  onPress={() => abrirModalEditar(item)}
                  style={estilos.botonFila}
                >
                  <Ionicons name="create" size={18} color="#93C5FD" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => eliminar(item.id)} style={estilos.botonFila}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={estilos.fondoModal}>
            <View style={estilos.cajaModal}>
              <Text style={estilos.tituloModal}>
                {idEditar ? 'Modificar Participante' : 'Nuevo Participante'}
              </Text>
              <Text style={estilos.etiquetaCampo}>Nombre Completo</Text>
              <TextInput
                placeholder="Escriba el nombre completo"
                placeholderTextColor="#94A3B8"
                value={nombre}
                onChangeText={setNombre}
                style={estilos.entradaFormulario}
                autoCapitalize="words"
              />
              <Text style={estilos.etiquetaCampo}>Estado</Text>
              <View style={estilos.contenedorEstados}>
                {(['Activo', 'Suspendido', 'Inactivo'] as EstadoParticipante[]).map(valor => (
                  <TouchableOpacity
                    key={valor}
                    style={[
                      estilos.botonEstado,
                      estado === valor && estilos.botonEstadoActivo,
                    ]}
                    onPress={() => setEstado(valor)}
                  >
                    <View
                      style={[
                        estilos.puntoBotonEstado,
                        { backgroundColor: obtenerColorEstado(valor) },
                      ]}
                    />
                    <Text
                      style={[
                        estilos.textoBotonEstado,
                        estado === valor && estilos.textoBotonEstadoActivo,
                      ]}
                    >
                      {valor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={estilos.filaBotonesModal}>
                <TouchableOpacity style={estilos.botonCancelar} onPress={limpiarFormulario}>
                  <Text style={estilos.textoCancelar}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={estilos.botonGuardar} onPress={guardar}>
                  <Text style={estilos.textoGuardar}>
                    {idEditar ? 'Actualizar' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenedor: {
    flex: 1,
    padding: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botonAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    gap: 8,
  },
  textoAdicionar: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contenedorBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  entradaBusqueda: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filaEncabezado: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  encabezadoNombre: {
    flex: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  encabezadoEstado: {
    flex: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  encabezadoAcciones: {
    flex: 1,
  },
  lineaSeparadoraCabecera: {
    height: 2,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    marginBottom: 8,
  },
  filaGrilla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 64, 175, 0.12)',
    borderRadius: 10,
    padding: 14,
  },
  lineaEntreFilas: {
    height: 1,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    marginVertical: 4,
  },
  textoNombre: {
    flex: 3,
    fontSize: 15,
    color: '#FFFFFF',
  },
  cajaEstado: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  puntoEstado: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textoEstado: {
    fontSize: 13,
    color: '#E2E8F0',
  },
  botonesFila: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonFila: {
    padding: 4,
  },
  textoVacio: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 40,
    fontSize: 15,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  cajaModal: {
    backgroundColor: '#0F1E39',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  tituloModal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  etiquetaCampo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  entradaFormulario: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  contenedorEstados: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  botonEstado: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  botonEstadoActivo: {
    borderColor: 'rgba(96, 165, 250, 0.5)',
    backgroundColor: 'rgba(30, 64, 175, 0.3)',
  },
  puntoBotonEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoBotonEstado: {
    fontSize: 12,
    color: '#94A3B8',
  },
  textoBotonEstadoActivo: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filaBotonesModal: {
    flexDirection: 'row',
    gap: 10,
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoCancelar: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: 'rgba(30, 64, 175, 0.6)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoGuardar: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Participantes;