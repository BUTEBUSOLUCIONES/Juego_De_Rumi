
# Módulo de Sesiones — Requerimientos Funcionales
## Ubicación del documento
`D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\docs\REQUERIMIENTOS_SESIONES.md`

## Ubicación del código
`D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\Sesiones.tsx`

## 📋 ÍNDICE
1. [Estructura de Datos](#1-estructura-de-datos)
2. [Interfaz — Grilla de Visualización](#2-interfaz--grilla-de-visualización)
3. [Formulario de Creación](#3-formulario-de-creación)
4. [Regla de Eliminación](#4-regla-de-eliminación)
5. [Reglas de Negocio](#5-reglas-de-negocio)
6. [Definición de Tipos (TypeScript)](#6-definición-de-tipos-typescript)
7. [Historial de Cambios](#7-historial-de-cambios)

---
## 1. Estructura de Datos
### Tabla / Entidad: `Sesiones`
| Campo | Tipo | Valores Permitidos | Descripción |
|-------|------|--------------------|-------------|
| `numero` | Número | Secuencial, único, autoincremental | Clave principal — orden de presentación |
| `fechaHora` | Texto | Formato: `dd-mm-aaaa hhmm` | Asignada al crear, **no editable** |
| `descripcion` | Texto | Generada automáticamente | Formato: `Sesión del [DíaSemana] [Día] de [Mes] del [Año]` — **no editable** |
| `valorApuesta` | Número | > 0, con máximo 2 decimales | Monto base de apuesta para la sesión en dólares |
| `estado` | Enumerado | `Activa` / `Suspendida` | Situación general de la sesión |

### Tabla / Entidad: `Partidas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Texto | Identificador único |
| `sesionNumero` | Número | Referencia obligatoria a `Sesiones.numero` — **clave de dependencia** |
| `nombre` | Texto | Identificador de la partida |
| `estado` | Enumerado | `EnCurso` / `Finalizada` |

### Tabla / Entidad: `SesionParticipantes` (Asignación)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sesionNumero` | Número | Referencia a `Sesiones.numero` |
| `participanteId` | Texto | Referencia a `Participantes.id` |
| `estadoEnSesion` | Enumerado | `Activo` / `Suspendido` — estado dentro de esta sesión |

---
## 2. Interfaz — Grilla de Visualización
### Columnas mostradas
| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| N° | `N°` | Número secuencial |
| Fecha y Hora | `Fecha/Hora` | `dd-mm-aaaa hhmm` — ej: `12-01-2020 21h23` |
| Apuesta | `Apuesta` | Valor base de apuesta formateado con 2 decimales |
| Cantidad de participantes | `Part.` | Cantidad total asignados a la sesión |
| Estado | `Estado` | Etiqueta de color: 🟢 `Activa` / 🟡 `Suspendida` |
| Acciones | *(sin título)* | Botón de eliminar |

### Orden de presentación
- **Descendente por número secuencial**: la sesión más reciente **siempre aparece arriba**
- Espaciado compacto entre filas — adaptado para pantalla móvil

---
## 3. Formulario de Creación
### Secuencia de llenado
1. **Fecha y Hora** → Se genera automáticamente al momento de crear → **solo lectura**
2. **Descripción** → Se genera automáticamente → **no editable**
3. **Valor de Apuesta** → Selección o ingreso manual:
   - **Lista desplegable (combo) con valores predefinidos:** `0.20`, `0.25`, `0.50`, `1.00` (dólares)
   - **Campo de ingreso libre:** permite escribir cualquier monto con **máximo 2 decimales**, siempre mayor a cero
   - El valor se muestra formateado con 2 decimales
4. **Selección de Participantes** → Lista que muestra **únicamente** participantes con estado = `Activo`
   - Mínimo: 3 participantes
   - Máximo: 5 participantes

### Validaciones al guardar
- ✅ Valor de apuesta **mayor a 0**
- ✅ Máximo **2 decimales** permitidos
- ✅ Entre 3 y 5 participantes seleccionados
- ✅ No se permite repetir el mismo participante en la misma sesión
- ✅ Solo participantes activos visibles para asignación
- ✅ Fecha y descripción no modificables

---
## 4. Regla de Eliminación — Definitiva
> **Una sesión se puede eliminar ÚNICAMENTE si NO tiene partidas asociadas.**

| Situación | ¿Se elimina? |
|---|---|
| Sesión sin ninguna partida registrada | ✅ **SÍ** se elimina |
| Sesión con al menos una partida (en curso o finalizada) | ❌ **NO** se elimina |
| La cantidad o estado de participantes **NO impide ni permite** la eliminación | No influye |

> La existencia de partidas es la **única condición** que determina si se puede borrar. Participantes asignados no bloquean la eliminación.

---
## 5. Reglas de Negocio
1. Grilla ordenada **descendente por número** → la última creada arriba, debe tener Sesion Fecha, Descripcion, Part, Valor Apuesta, Estado 
2. Fecha y descripción automáticas → no editables
3. Formato fecha: `dd-mm-aaaa hhmm`
4. **Valor de apuesta:** combo con valores `0.20`, `0.25`, `0.50`, `1.00` + ingreso libre con 2 decimales → incluido en grilla
5. Encabezado: `Part.` para ajuste móvil
6. Botón de retorno → Pantalla de Inicio
7. Mínimo 3 / máximo 5 participantes por sesión
8. Solo participantes activos aparecen para asignar
9. Cambio de estado dentro de la sesión **no afecta** el estado general del participante
10. **Eliminación:** Única restricción → **sin partidas asociadas**
    - Si tiene partidas → no se borra, tenga quien tenga
    - Si no tiene partidas → se borra, tenga participantes o no
11. Encabezado de acciones **sin título**

---
## 6. Definición de Tipos (TypeScript)
```typescript
type EstadoSesion = 'Activa' | 'Suspendida';
type EstadoParticipanteEnSesion = 'Activo' | 'Suspendido';
type EstadoPartida = 'EnCurso' | 'Finalizada';

type Sesion = {
  numero: number;
  fechaHora: string;
  descripcion: string;
  valorApuesta: number;
  estado: EstadoSesion;
};

type Partida = {
  id: string;
  sesionNumero: number;
  nombre: string;
  estado: EstadoPartida;
};

type SesionDetalle = {
  sesionNumero: number;
  participanteId: string;
  nombreParticipante: string;
  estadoEnSesion: EstadoParticipanteEnSesion;
};


## 7. Historial de Cambios
Fecha	Versión	Descripción del cambio
2026-10-06	1.0	Definición inicial del módulo
2026-10-06	1.1	Descripción y fecha automáticas; reglas de asignación 3-5 participantes
2026-10-06	1.2	Suspensión local no afecta estado general; orden descendente
2026-10-06	1.3	Formato fecha: dd-mm-aaaa hhmm; encabezado Part.; botón retorna a Inicio; diseño compacto móvil
2026-10-06	1.4	❌ Corrección regla eliminación: depende de partidas, no de participantes
2026-10-07	1.5	✅ Agregado campo Valor de Apuesta: combo con valores 0.20, 0.25, 0.50, 1.00 + ingreso libre con 2 decimales; columna en grilla
2026-10-07	1.6	✅ Estándar aplicado: rutas absolutas completas en todos los encabezados y referencias
2026-10-09	1.7	✅ 
1. Descripción automática: Sesión del Martes 9 de Agosto del 2026	✅
2. Formato fecha: 29-09-2026 12h30	✅
3. Título "Estado" en color blanco	✅
4. Grilla con estilo Zebra (filas alternas)	✅
5. Botón visible: Crear Sesión con ícono	✅
6. Usa base de datos local (AsyncStorage)