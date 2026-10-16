// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ConfiguracionServidor.tsx
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    CLAVE_GLOBAL,
    ConfiguracionServidor as TipoConfiguracion,
    guardarConfiguracion,
    obtenerConfiguracion,
    restablecerConfiguracion,
} from '../servicios/ConfiguracionServidor';

// 👇 IMPORTANTE: Agregamos navegación
import { useNavigation } from '@react-navigation/native';

// ==============================================================
// VALIDADORES (fuera del componente)
// ==============================================================

/**
 * Regex IPv4 estricta: cada bloque entre 0 y 255, sin ceros a la izquierda.
 */
const REGEX_IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

/**
 * Valida que una cadena sea una IPv4 correcta.
 */
const esIPv4Valida = (ip: string): boolean => {
    return REGEX_IPV4.test(ip.trim());
};

/**
 * Valida que el puerto sea un número entero entre 1 y 65535.
 */
const esPuertoValido = (puerto: string): boolean => {
    if (!/^\d+$/.test(puerto)) return false;
    const n = parseInt(puerto, 10);
    return n >= 1 && n <= 65535;
};

/**
 * Intenta contactar el servidor. Devuelve true si responde (cualquier código HTTP).
 * NO bloquea: solo informa.
 */
const verificarServidorResponde = async (
    ip: string,
    puerto: string,
    carpeta: string
): Promise<boolean> => {
    const carpetaLimpia = carpeta.replace(/^\/+|\/+$/g, '');
    const url = `http://${ip}:${puerto}${carpetaLimpia ? '/' + carpetaLimpia : ''}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch {
        return false;
    }
};

export default function ConfiguracionServidor() {
    // ==============================================================
    // NAVEGACIÓN
    // ==============================================================
    const navigation = useNavigation();

    // ==============================================================
    // REFS
    // ==============================================================
    const inputClaveRef = useRef<TextInput>(null);

    // ==============================================================
    // ESTADOS
    // ==============================================================
    const [desbloqueado, setDesbloqueado] = useState(false);
    const [claveIngresada, setClaveIngresada] = useState('');
    const [cargando, setCargando] = useState(true);
    const [configuracion, setConfiguracion] = useState<TipoConfiguracion>({
        ip: '',
        puerto: '',
        carpeta: '',
    });
    const [guardando, setGuardando] = useState(false);

    // ==============================================================
    // CARGA INICIAL
    // ==============================================================
    useEffect(() => {
        const cargar = async () => {
            const config = await obtenerConfiguracion();
            setConfiguracion(config);
            setCargando(false);
        };
        cargar();
    }, []);

    // ==============================================================
    // FUNCIÓN: verificarClave - SOLUCIÓN FUERTE
    // ==============================================================
    /**
     * Estrategia:
     *  1. Cerramos el teclado (dismiss) y forzamos blur del input.
     *  2. Esperamos 3 capas de sincronización (2 rAF + setTimeout de respaldo).
     *  3. Leemos el valor directamente desde el estado Y, como respaldo,
     *     desde el evento de cambio más reciente capturado en un ref.
     *  4. Comparamos contra CLAVE_GLOBAL con trim() y sin distinguir
     *     mayúsculas/minúsculas si fuera necesario (aquí sí distingue).
     */

    // Capturamos el último valor escrito en un ref (respaldo ante teclados lentos)
    const ultimoValorRef = useRef('');

    const onChangeClave = (texto: string) => {
        setClaveIngresada(texto);
        ultimoValorRef.current = texto;
    };

    const verificarClave = () => {
        console.log('[DEBUG] verificarClave disparado');
        console.log('[DEBUG] Estado actual:', JSON.stringify(claveIngresada));
        console.log('[DEBUG] Ref actual:', JSON.stringify(ultimoValorRef.current));

        // 1. Forzar blur del input y cerrar teclado
        try {
            inputClaveRef.current?.blur();
        } catch (e) {
            console.log('[DEBUG] error blur:', e);
        }
        Keyboard.dismiss();

        // 2. Esperamos a que React procese los cambios pendientes.
        //    En Android el commit del último carácter puede tardar más,
        //    así que usamos rAF + setTimeout como respaldo.
        const validar = () => {
            // Preferimos el ref (siempre tiene el último valor que el teclado comiteó)
            const desdeRef = ultimoValorRef.current?.trim() ?? '';
            const desdeEstado = claveIngresada.trim();

            // Elegimos el que tenga más longitud (evita perder el último carácter)
            const clave = desdeRef.length >= desdeEstado.length ? desdeRef : desdeEstado;

            console.log('[DEBUG] Clave a validar:', JSON.stringify(clave));
            console.log('[DEBUG] Clave esperada:', JSON.stringify(CLAVE_GLOBAL));

            if (clave === CLAVE_GLOBAL) {
                console.log('[DEBUG] ✅ Clave correcta');
                setDesbloqueado(true);
                setClaveIngresada('');
                ultimoValorRef.current = '';
            } else {
                console.log('[DEBUG] ❌ Clave incorrecta');
                Alert.alert('❌ Clave incorrecta', 'Verifica la clave e intenta de nuevo.');
                setClaveIngresada('');
                ultimoValorRef.current = '';
            }
        };

        if (Platform.OS === 'android') {
            // Android: doble rAF + setTimeout de respaldo
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(validar, 100);
                });
            });
        } else {
            // iOS: con rAF es suficiente
            requestAnimationFrame(validar);
        }
    };

    // ==============================================================
    // FUNCIÓN: guardarCambios (con validaciones + verificación servidor)
    // ==============================================================
    const guardarCambios = async () => {
        Keyboard.dismiss();

        // 1. Validar IP
        const ipLimpia = configuracion.ip.trim();
        if (!ipLimpia) {
            Alert.alert('Validación', 'La IP no puede estar vacía.');
            return;
        }
        if (!esIPv4Valida(ipLimpia)) {
            Alert.alert(
                'IP inválida',
                'La IP debe tener el formato correcto (ej: 192.168.1.53).\nCada bloque debe estar entre 0 y 255.'
            );
            return;
        }

        // 2. Validar puerto
        const puertoLimpio = configuracion.puerto.trim();
        if (!puertoLimpio) {
            Alert.alert('Validación', 'El puerto no puede estar vacío.');
            return;
        }
        if (!esPuertoValido(puertoLimpio)) {
            Alert.alert(
                'Puerto inválido',
                'El puerto debe ser un número entre 1 y 65535.'
            );
            return;
        }

        // 3. Todo válido → verificar si el servidor responde (informativo, no bloqueante)
        setGuardando(true);
        try {
            const responde = await verificarServidorResponde(
                ipLimpia,
                puertoLimpio,
                configuracion.carpeta
            );

            if (responde) {
                await guardarConfiguracion(configuracion);
                Alert.alert(
                    '✅ Guardado',
                    'Servidor detectado y configuración guardada correctamente.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(
                    '⚠️ Servidor no responde',
                    `No se pudo contactar a http://${ipLimpia}:${puertoLimpio}.\n\n¿Deseas guardar la configuración de todos modos?`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Guardar igual',
                            onPress: async () => {
                                await guardarConfiguracion(configuracion);
                                Alert.alert(
                                    '✅ Guardado',
                                    'La configuración se guardó (sin verificar servidor).',
                                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                                );
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo guardar la configuración.');
            console.log(error);
        } finally {
            setGuardando(false);
        }
    };

    // ==============================================================
    // FUNCIÓN: restablecer
    // ==============================================================
    const restablecer = () => {
        Alert.alert(
            '⚠️ Restablecer configuración',
            '¿Seguro que quieres volver a los valores por defecto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Restablecer',
                    style: 'destructive',
                    onPress: async () => {
                        await restablecerConfiguracion();
                        const config = await obtenerConfiguracion();
                        setConfiguracion(config);
                        Alert.alert('✅ Restablecido', 'La configuración volvió a los valores por defecto.');
                    },
                },
            ]
        );
    };

    // ==============================================================
    // FUNCIÓN: bloquear
    // ==============================================================
    const bloquear = () => {
        setDesbloqueado(false);
        setClaveIngresada('');
        ultimoValorRef.current = '';
    };

    // ==============================================================
    // FUNCIÓN: retornar al menú SIN guardar ✅
    // ==============================================================
    const retornarMenu = () => {
        navigation.goBack();
    };

    // ==============================================================
    // RENDER: Cargando
    // ==============================================================
    if (cargando) {
        return (
            <View style={estilos.centrado}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={estilos.textoCargando}>Cargando configuración...</Text>
            </View>
        );
    }

    // ==============================================================
    // RENDER: Formulario bloqueado
    // ==============================================================
    if (!desbloqueado) {
        return (
            <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
                <View style={estilos.encabezadoBloqueo}>
                    <Ionicons name="lock-closed" size={56} color="#F59E0B" />
                    <Text style={estilos.titulo}>Configuración Protegida</Text>
                    <Text style={estilos.descripcion}>
                        Ingresa la clave global para acceder a la configuración del servidor.
                    </Text>
                </View>
                <View style={estilos.tarjetaFormulario}>
                    <Text style={estilos.etiquetaCampo}>Clave global:</Text>
                    <TextInput
                        ref={inputClaveRef}
                        style={estilos.entradaTexto}
                        value={claveIngresada}
                        onChangeText={onChangeClave}
                        placeholder="Clave de Acceso"
                        placeholderTextColor="#64748B"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                        importantForAutofill="no"
                        textContentType="none"
                        onSubmitEditing={verificarClave}
                        returnKeyType="done"
                    />
                    {/* ✅ Fila de botones: Desbloquear + Retornar */}
                    <View style={estilos.filaBotones}>
                        <TouchableOpacity
                            style={[estilos.botonPrimario, estilos.botonMitad]}
                            onPress={verificarClave}
                        >
                            <Ionicons name="key" size={20} color="#FFFFFF" />
                            <Text style={estilos.textoBotonPrimario}>Desbloquear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[estilos.botonRetornar, estilos.botonMitad]}
                            onPress={retornarMenu}
                        >
                            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                            <Text style={estilos.textoBotonRetornar}>Retornar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    // ==============================================================
    // RENDER: Formulario desbloqueado
    // ==============================================================
    return (
        <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
            <View style={estilos.encabezadoDesbloqueado}>
                <Ionicons name="settings" size={40} color="#22C55E" />
                <Text style={estilos.titulo}>Configuración del Servidor</Text>
                <Text style={estilos.descripcion}>
                    Modifica los datos de conexión. Se aplican al instante.
                </Text>
            </View>

            <View style={estilos.tarjetaFormulario}>
                <Text style={estilos.etiquetaCampo}>IP del servidor:</Text>
                <TextInput
                    style={estilos.entradaTexto}
                    value={configuracion.ip}
                    onChangeText={(texto) => {
                        // Filtra: solo dígitos y puntos
                        const filtrado = texto.replace(/[^0-9.]/g, '');
                        setConfiguracion({ ...configuracion, ip: filtrado });
                    }}
                    placeholder="Ej: 192.168.1.53"
                    placeholderTextColor="#64748B"
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={15}
                />

                <Text style={estilos.etiquetaCampo}>Puerto:</Text>
                <TextInput
                    style={estilos.entradaTexto}
                    value={configuracion.puerto}
                    onChangeText={(texto) => {
                        // Filtra: solo dígitos
                        const filtrado = texto.replace(/[^0-9]/g, '');
                        setConfiguracion({ ...configuracion, puerto: filtrado });
                    }}
                    placeholder="Ej: 8000"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={5}
                />

                <Text style={estilos.etiquetaCampo}>Carpeta del proyecto (opcional):</Text>
                <TextInput
                    style={estilos.entradaTexto}
                    value={configuracion.carpeta}
                    onChangeText={(texto) => setConfiguracion({ ...configuracion, carpeta: texto })}
                    placeholder="Ej: api o rumi/v1"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                />
                <Text style={estilos.textoAyuda}>
                    Déjalo vacío si el servidor no usa subcarpeta.
                </Text>

                {/* ✅ Fila de botones: Guardar + Reset + Bloquear + Menú */}
                <View style={estilos.filaBotones}>
                    <TouchableOpacity
                        style={[estilos.botonPrimario, estilos.botonCuarto, guardando && estilos.botonDeshabilitado]}
                        onPress={guardarCambios}
                        disabled={guardando}
                    >
                        {guardando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="save" size={18} color="#FFFFFF" />
                                <Text style={estilos.textoBotonPrimario}>Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[estilos.botonSecundario, estilos.botonCuarto]}
                        onPress={restablecer}
                    >
                        <Ionicons name="refresh" size={16} color="#FFFFFF" />
                        <Text style={estilos.textoBotonSecundario}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[estilos.botonBloquear, estilos.botonCuarto]}
                        onPress={bloquear}
                    >
                        <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                        <Text style={estilos.textoBotonBloquear}>Bloquear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[estilos.botonRetornar, estilos.botonCuarto]}
                        onPress={retornarMenu}
                    >
                        <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                        <Text style={estilos.textoBotonRetornar}>Menú</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={estilos.aviso}>
                <Ionicons name="information-circle" size={18} color="#60A5FA" />
                <Text style={estilos.textoAviso}>
                    La URL actual del servidor se construye como:
                    {'\n'}
                    <Text style={estilos.textoAvisoDestacado}>
                        http://{configuracion.ip || '???'}:{configuracion.puerto || '???'}
                        {configuracion.carpeta ? `/${configuracion.carpeta}` : ''}
                    </Text>
                </Text>
            </View>
        </ScrollView>
    );
}

// ==============================================================
// ESTILOS ACTUALIZADOS - PALETA PROFESIONAL
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
    encabezadoBloqueo: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    encabezadoDesbloqueado: {
        alignItems: 'center',
        marginBottom: 24,
    },
    titulo: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 12,
        textAlign: 'center',
    },
    descripcion: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    tarjetaFormulario: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.2)',
    },
    etiquetaCampo: {
        fontSize: 14,
        color: '#CBD5E1',
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 12,
    },
    entradaTexto: {
        backgroundColor: '#1E293B',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    textoAyuda: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 4,
    },

    // ==============================================================
    // CONTENEDOR DE FILA DE BOTONES
    // ==============================================================
    filaBotones: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 20,
    },
    botonMitad: {
        flex: 1,
    },
    botonCuarto: {
        flex: 1,
    },

    // ==============================================================
    // BOTÓN PRIMARIO (Guardar / Desbloquear) - Verde esmeralda
    // ==============================================================
    botonPrimario: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#059669',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    botonDeshabilitado: {
        opacity: 0.5,
    },
    textoBotonPrimario: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // ==============================================================
    // BOTÓN RESET - Rojo sólido
    // ==============================================================
    botonSecundario: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#DC2626',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    textoBotonSecundario: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // ==============================================================
    // BOTÓN BLOQUEAR - Gris sólido
    // ==============================================================
    botonBloquear: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#475569',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    textoBotonBloquear: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // ==============================================================
    // BOTÓN RETORNAR / MENÚ - Azul sólido
    // ==============================================================
    botonRetornar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    textoBotonRetornar: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    // ==============================================================
    // AVISO INFORMATIVO
    // ==============================================================
    aviso: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'rgba(96, 165, 250, 0.08)',
        borderRadius: 8,
        padding: 14,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.2)',
    },
    textoAviso: {
        color: '#CBD5E1',
        fontSize: 13,
        flex: 1,
        lineHeight: 20,
    },
    textoAvisoDestacado: {
        color: '#60A5FA',
        fontWeight: '700',
    },
});