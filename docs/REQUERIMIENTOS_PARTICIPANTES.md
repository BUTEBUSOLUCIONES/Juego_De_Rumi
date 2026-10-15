# D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\docs\REQUERIMIENTOS_PARTICIPANTES.md

# MÓDULO DE PARTICIPANTES — REQUERIMIENTOS FUNCIONALES

## Ubicación del código
`packages/mobile/src/screens/Participantes.tsx`

## 📋 ÍNDICE
1. [Estructura de Datos](#1-estructura-de-datos)
2. [Interfaz — Grilla de Visualización](#2-interfaz--grilla-de-visualización)
3. [Botón Principal](#3-botón-principal)
4. [Formulario de Ingreso / Edición](#4-formulario-de-ingreso--edición)
5. [Reglas de Negocio](#5-reglas-de-negocio)
6. [Definición de Tipos (TypeScript)](#6-definición-de-tipos-typescript)
7. [Estructura de Datos — Definición Técnica](#7-estructura-de-datos--definición-técnica)
   - 7.1 [Validaciones del campo Nombre](#71-validaciones-del-campo-nombre)
   - 7.2 [Valores permitidos para el campo Estado](#72-valores-permitidos-para-el-campo-estado)
   - 7.3 [Estructura completa del registro Participante](#73-estructura-completa-del-registro-participante)
   - 7.4 [En la Base de Datos](#74-en-la-base-de-datos)
8. [Historial de Cambios](#8-historial-de-cambios)

---

## 1. ESTRUCTURA DE DATOS
### Tabla / Entidad: `Participantes`
| Campo | Tipo | Valores Permitidos | Descripción |
|---|---|---|---|
| `id` | Texto | Único | Identificador autogenerado |
| `nombre` | Texto | Obligatorio, no vacío | Nombre completo del participante |
| `estado` | Enumerado | `Activo` / `Suspendido` / `Inactivo` | Situación actual del participante |

> **Nota importante:** No se incluyen `correo` ni `teléfono` en la grilla ni como campos obligatorios, según decisión funcional.

---

## 2. INTERFAZ — GRILLA DE VISUALIZACIÓN
### Columnas mostradas
- **Nombre** → Nombre completo del participante — **ordenado alfabéticamente de forma ascendente**
- **Estado** → Etiqueta con color según valor:
  - 🟢 `Activo` → Verde
  - 🟡 `Suspendido` → Ámbar/Naranja
  - 🔴 `Inactivo` → Rojo
- *(sin título)* → Botones de modificar y eliminar
- El encabezado de la columna de acciones **se presenta en blanco, sin texto**
- Todos los registros se muestran **siempre ordenados alfabéticamente por nombre**, sin importar el orden en que se ingresaron

### Funcionalidad de búsqueda
- Campo de texto en la parte superior
- Filtra **en tiempo real** por coincidencia parcial del nombre
- No distingue mayúsculas/minúsculas

---

## 3. BOTÓN PRINCIPAL
- **"Adicionar Participante"** ubicado en la parte superior, sobre el buscador
- Abre formulario en ventana emergente (modal)

---

## 4. FORMULARIO DE INGRESO / EDICIÓN
### Campos a recibir
| Campo | Validación |
|---|---|
| Nombre completo | Requerido, no puede estar vacío |
| Estado | Selección única: Activo / Suspendido / Inactivo |

### Comportamiento
- **Nuevo**: limpia formulario → guarda → agrega a la lista (se reordena alfabéticamente)
- **Editar**: carga valores → modifica → actualiza fila
- **Cancelar**: cierra formulario sin guardar cambios

---

## 5. REGLAS DE NEGOCIO
1. La grilla **solo muestra** `nombre` y `estado`
2. La búsqueda filtra **únicamente** por el campo `nombre`
3. El campo `estado` es obligatorio y tiene **tres valores fijos**
4. Al eliminar, **siempre** se muestra mensaje de confirmación
5. No se permiten nombres vacíos
6. Los datos se mantienen en memoria; para persistencia permanente se debe integrar base de datos
7. El nombre del participante es único: no puede existir dos registros con el mismo valor
8. El nombre no puede contener números, símbolos, signos de puntuación ni caracteres especiales
9. Al guardar, se eliminan espacios al inicio y al final; no se aceptan nombres compuestos solo por espacios
10. La grilla se presenta **siempre ordenada alfabéticamente por nombre** de forma ascendente
11. El encabezado de la columna de acciones **no muestra título**, queda en blanco

---

## 6. DEFINICIÓN DE TIPOS (TypeScript)
```typescript
// Valores posibles del campo estado
type EstadoParticipante = 'Activo' | 'Suspendido' | 'Inactivo';

// Estructura completa del registro participante
type Participante = {
  id: string;
  nombre: string;
  estado: EstadoParticipante;
};

7. ESTRUCTURA DE DATOS — DEFINICIÓN TÉCNICA
7.1 Validaciones del campo Nombre

El campo nombre cumple estrictamente:
✅ Solo letras mayúsculas/minúsculas, tildes, ñ y espacios entre palabras
❌ Sin números, sin guiones, sin símbolos ni caracteres especiales
❌ No puede estar vacío ni contener solo espacios
✅ Único en todo el listado: antes de guardar se verifica que no exista otro igual
✅ Se eliminan espacios al inicio y al final automáticamente

7.2 Valores permitidos para el campo Estado
El campo estado solo admite estos tres valores, sin excepciones:
Activo
Suspendido
Inactivo
No se aceptan nombres distintos ni variantes. Esto garantiza que la información sea uniforme en todo el sistema.

7.3 Estructura completa del registro Participante
Campo	Tipo de dato	Descripción
id	Texto único	Identificador que se genera automáticamente al crear el registro
nombre	Texto	Nombre completo del participante — es obligatorio y único
estado	Valor fijo	Situación actual del participante — solo puede ser uno de los 3 valores indicados

7.4 En la Base de DatosCuando se conecte la aplicación a una base de datos para guardar la información de forma permanente, se debe crear la tabla con la siguiente estructura:Nombre de la tabla: Participantes
Columna	Tipo de dato	Restricción
id	Texto / Número	Clave primaria — no se repite nunca
nombre	Texto (máx. 250 caracteres)	No nulo, único, valida solo letras y espacios
estado	Texto (máx. 20 caracteres)	Solo admite: Activo, Suspendido, Inactivo

Regla importante:
La columna estado debe configurarse para rechazar automáticamente cualquier valor distinto a los tres indicados.Ejemplo en SQL:
CREATE TABLE Participantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE CHECK (
    nombre ~ '^[A-Za-zÁáÉéÍíÓóÚúÑñ ]+$'
    AND TRIM(nombre) <> ''
  ),
  estado TEXT NOT NULL CHECK (estado IN ('Activo', 'Suspendido', 'Inactivo'))
);

8. HISTORIAL DE CAMBIOS
Fecha	Versión	Descripción del cambio
2026-10-06	1.0	Definición inicial — grilla, filtro por nombre, campo estado con 3 valores, gestión completa (crear, leer, modificar, eliminar), documentación estructurada
2026-10-06	1.2	Grilla ordenada alfabéticamente por nombre; encabezado de columna Acciones sin título
2026-10-08	1.3	Aplicadas normas de formato del proyecto: encabezado con ruta absoluta, corrección de bloques de código, estructura unificada y validaciones detalladas del campo nombre