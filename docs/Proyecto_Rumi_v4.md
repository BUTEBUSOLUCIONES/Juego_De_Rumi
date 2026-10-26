#  DOCUMENTO DE CONTEXTO DEL PROYECTO — JUEGO DE RUMI

**Fecha de generación:** 22 de octubre de 2026  
**Propósito:** Transferir el conocimiento completo del proyecto a un nuevo chat para continuar el desarrollo sin pérdida de contexto.  
**Chat de referencia (historial completo):** El chat original contiene toda la traza de decisiones, logs, errores y soluciones aplicadas.

---

## 1. DESCRIPCIÓN GENERAL DEL PROYECTO

Aplicación móvil (Expo / React Native / TypeScript) para la gestión de partidas del juego de cartas **Rumi**, con sincronización de datos hacia un servidor central Python (FastAPI + PostgreSQL). Permite crear sesiones, registrar participantes, llevar el control de partidas en tiempo real y sincronizar todo con un servidor local en la red.

---

## 2. ARQUITECTURA DEL SISTEMA

```text
┌─────────────────────────────────────────────────────────────┐
│  TABLET (Expo / React Native / TypeScript)                  │
│  - SQLite local (expo-sqlite)                               │
│  - AsyncStorage (datos auxiliares)                          │
│  - Pantallas: GestorSesiones, SesionActiva, Participantes…  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP POST (lotes JSON)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVIDOR PYTHON (FastAPI) — Windows 11                     │
│  - Puerto 8000                                              │
│  - Arranque automático vía Tarea Programada                 │
│  - Script central: servidor_python.py                       │
│  - App montada en /rumi                                     │
└────────────────────────────────────────────────────────────┘
                        │ psycopg2
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL 14+ — Base de datos: partidas_rumi              │
│  - Tablas: sesiones, participantes, participantes_sesion,   │
│            partidas, historial_sincronizacion               │
└─────────────────────────────────────────────────────────────┘

3. ESTRUCTURA DE ARCHIVOS CLAVE
3.1. Frontend móvil (Expo)
D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\
├── screens/
│   ├── GestorSesiones.tsx      ← Listado y creación de sesiones
│   ├── SesionActiva.tsx        ← Pantalla principal de juego
│   ├── Participantes.tsx       ← Gestión de participantes
│   ├── Diagnostico.tsx         ← Pantalla de sincronización
│   ├── Historial.tsx
│   ├── Estadisticas.tsx
│   ├── ResultadosSesion.tsx
│   └── …
└── servicios/
    ├── BaseDatos.ts            ← Capa SQLite (CRUD + tipos)
    ├── ConexionSQLite.ts       ← Conexión a expo-sqlite
    ├── Sincronizacion.ts       ← Envío de lotes al servidor
    ├── ConfiguracionServidor.ts← URL base del servidor
    └── Diagnostico.ts

    3.2. Backend Python
    D:\Servidor_web_python\
├── servidor_python.py          ← Script central (cargador dinámico)
└── apps/
    └── rumi/
        ├── app.py              ← FastAPI: rutas de sincronización
        └── main.py             ← (no se usa actualmente)

4. BASE DE DATOS
4.1. SQLite (local en tablet)
Tablas: sesiones, participantes, participantes_sesion, partidas, historial_sincronizacion.
Cada tabla tiene columna sincronizado con valores 'Pendiente' | 'Sincronizado'.
4.2. PostgreSQL (servidor)
Base de datos: partidas_rumi
Usuario/contraseña: postgres / postgres
Puerto: 5432
Tablas y columnas reales (confirmadas):
Tabla
Columnas clave
sesiones
numero (PK), fecha_hora, descripcion, valor_apuesta_base, estado
participantes
id (PK), nombre, estado, fecha_registro
participantes_sesion
participante_id, numero_sesion (PK compuesta), nombre, estado_en_sesion, partidas_ganadas, partidas_perdidas, valores_ganados, valores_perdidos
partidas
identificador (PK), numero_sesion, numero, estado, identificador_ganador, monto_ganado, fecha_hora_inicio, fecha_hora_finalizacion
historial_sincronizacion
id, fecha_inicio, fecha_fin, nombre_tabla, registros_enviados, registros_recibidos, mensaje, estado
Nota: La tabla participantes_general fue renombrada a participantes en PostgreSQL.
5. FLUJO DE SINCRONIZACIÓN
La tablet agrupa registros pendientes por tabla.
Envía lotes vía POST a:
/rumi/api/sincronizar/sesiones-lote
/rumi/api/sincronizar/participantes-lote
/rumi/api/sincronizar/sesion-participante-lote
/rumi/api/sincronizar/partidas-lote
El servidor hace UPSERT (SELECT + INSERT/UPDATE) y registra en historial_sincronizacion.
La tablet marca los registros como 'Sincronizado' solo si el servidor responde {"nuevos": X, "actualizados": Y}.
6. REGLAS DE CODIFICACIÓN DEL PROYECTO (OBLIGATORIAS)
Idioma: Todo el código, comentarios, nombres de funciones/variables y documentación en español.
Nomenclatura:
Funciones: verboSustantivo en camelCase (ej. obtenerSesiones, guardarPartida).
Variables: camelCase descriptivo (ej. numeroSesion, participantesActivos).
Constantes: MAYÚSCULAS_CON_GUIONES (ej. VALORES_APUESTA).
Documentación obligatoria en cada función:
           // ==============================================================
   // FUNCIÓN: nombreFuncion
   // INICIO
   // Propósito: …
   // Parámetros: …
   // Retorna: …
   // ==============================================================
   // (código)
   // ==============================================================
   // FIN: nombreFuncion
   // ==============================================================

   Historial de cambios al inicio de cada archivo en formato tabla Markdown.
No usar diccionarios Dict[str, Any] en FastAPI cuando se pueda usar Pydantic con Optional y Field(default=…).
No parchar el servidor para corregir datos corruptos del cliente. La integridad se garantiza en el origen (cliente).
Una sola solución por respuesta, sin dar "dos opciones" al usuario. Ser puntual y concreto.
7. PROBLEMAS RESUELTOS (HISTORIAL TÉCNICO)
#
Problema
Causa raíz
Solución aplicada
1
Error 404 en todas las rutas
servidor_python.py buscaba app.py en la raíz de apps/ en lugar de apps/rumi/
Reescrito servidor_python.py con carga explícita de apps/rumi/app.py y montaje en /rumi
2
Error 422 Unprocessable Content
Modelos Pydantic estrictos rechazaban campos nulos/omitidos enviados por la tablet
Modelos con Optional + Field(default=…) y populate_by_name = True
3
Error 500 en partidas-lote
Columnas sesion_id, sincronizado, actualizado_en no existen en la tabla real partidas
Ajustadas las consultas a las columnas reales: identificador_ganador, monto_ganado, fecha_hora_finalizacion
4
numero_sesion = 0 en partidas
Condición de carrera en SesionActiva.tsx al crear la partida antes de que sesionBase.numero estuviera definido
Validación estricta con fallback a sesionNumeroRef.current y bloqueo si es <= 0
5
nombre vacío en participantes_sesion
La consulta obtenerTodosLosParticipantes apuntaba a tabla participantes pero en SQLite local aún podía existir como participantes_general
guardarAsignacionParticipanteSesion ahora consulta ambas tablas con fallback
6
identificador_ganador NULL en empates/anuladas
actualizarPartida no manejaba undefined explícitamente
Conversión explícita undefined → null en el mapeo de valores
8. ESTADO ACTUAL (22/10/2026)
✅ Funcional
Servidor Python arranca automáticamente con Windows y monta la app en /rumi.
Sincronización de lotes funciona (200 OK en los 4 endpoints).
Creación de sesiones y asignación de participantes desde GestorSesiones.tsx.
Flujo de juego en SesionActiva.tsx (crear partida, finalizar, estadísticas).
⚠️ Pendiente de verificar / Acciones inmediatas
Verificar que las últimas correcciones de BaseDatos.ts y SesionActiva.tsx eliminen definitivamente el envío de nombre: "" y numeroSesion: 0.
Ejecutar el script SQL de saneamiento para limpiar registros corruptos previos en PostgreSQL.
Retirar los bloques print("📥 DATOS RECIBIDOS...") en app.py (logs de depuración temporales) una vez el flujo esté 100% estable.
9. SCRIPT SQL DE SANEAMIENTO (Pendiente de ejecutar)
sql
1234567891011121314
10. INSTRUCCIONES PARA EL NUEVO CHAT
Al iniciar la conversación en el nuevo chat, pega este documento completo y agrega el siguiente prompt:
"Continúo el proyecto Rumi desde este punto. El último trabajo fue corregir en el cliente (BaseDatos.ts y SesionActiva.tsx) el envío de nombre: "" y numeroSesion: 0. Pendiente: verificar que esas correcciones funcionen, ejecutar el script SQL de saneamiento y retirar los logs de depuración de app.py. Respetar estrictamente las reglas de codificación del punto 6."
1