# Módulo — Sesión Activa
## Ubicación del código
`packages/mobile/src/screens/SesionActiva.tsx`

## 📋 ÍNDICE
1. [Objetivo](#1-objetivo)
2. [Funciones Principales](#2-funciones-principales)
3. [Reglas de Negocio](#3-reglas-de-negocio)
4. [Actualización de Datos](#4-actualización-de-datos)
   - 4.1 [Por Sesión](#41-por-sesión)
   - 4.2 [Por Participante](#42-por-participante)
5. [Interfaz — Elementos Visuales](#5-interfaz--elementos-visuales)
6. [Definición de Tipos](#6-definición-de-tipos)
7. [Cierre de Sesión](#7-cierre-de-sesión)
8. [Historial de Cambios](#8-historial-de-cambios)

---

## 1. Objetivo
Pantalla de trabajo en tiempo real durante el desarrollo de una sesión. Permite gestionar participantes, controlar el ciclo de partidas y mantener estadísticas actualizadas.

---

## 2. Funciones Principales
| N° | Función | Descripción |
|----|---------|-------------|
| 1 | Suspender o reactivar participante | Cambia el estado del participante dentro de la sesión |
| 2 | Crear partida automática | Al abrir la pantalla, si no existe partida activa, se crea automáticamente |
| 3 | Declarar resultado | Permite elegir un ganador o marcar empate |
| 4 | Finalizar partida | Cierra la partida actual, valida el resultado y dispara actualizaciones |
| 5 | Declaración obligatoria | No se puede finalizar sin indicar ganador **o** marcar empate |
| 6 | Siguiente partida automática | Al finalizar, se crea inmediatamente una nueva partida con los participantes activos |
| 7 | Actualización de estadísticas | Se recalculan todos los valores de sesión y de cada participante |
| 8 | Cerrar sesión | Finaliza la sesión completamente; bloquea nuevas partidas |
| 9 | Mostrar resultado anterior | Exhibir el participante que ganó la última partida o indicar si hubo empate |
| 10 | Totalizador de partida | Al pie de la grilla muestra cantidad de participantes activos y valor total de apuestas |

> **Modificaciones recientes:**
> - Se elimina botón "Iniciar Partida" → la creación es automática
> - Se elimina columna de partidas empatadas de la lista de participantes
> - Columna "Saldo" reemplazada por "Valor Apuesta" — solo visible para activos; $0.00 para suspendidos
> - Se agrega visualización del resultado de la última partida finalizada
> - Texto de apuesta en cabecera: "Apuesta Individual: $0.50"
> - Pie de grilla con totales de participantes y valor de apuestas

---

## 3. Reglas de Negocio
- Al cargar la pantalla: si no hay partida en curso → se crea automáticamente ✅
- Se debe mantener **mínimo 3 participantes activos** en la sesión. No se puede suspender si quedarían menos de 3 activos.
- Solo puede existir **una partida en curso** a la vez.
- No se puede finalizar partida sin seleccionar ganador **ni** sin marcar empate: **uno de los dos es obligatorio**.
- No se puede cerrar la sesión si hay una partida en curso; debe finalizarse primero.
- Al cerrar la sesión, esta pasa a estado "Cerrada" y ya no admite nuevas partidas.
- La visualización del último resultado se actualiza inmediatamente al finalizar cada partida.
- El valor de apuesta individual solo aplica a participantes en estado Activo; los demás muestran $0.00.
- El valor total de apuestas por partida = `valor_apuesta × cantidad de participantes activos`.
- El valor de apuesta se acumula en el total de la sesión **solo cuando hay ganador definido**
- Si la partida termina en empate, el monto NO se suma al total acumulado de la sesión
---

## 4. Actualización de Datos

### 4.1 Por Sesión
Al finalizar cada partida, se incrementan los siguientes contadores:

| Campo | Descripción | Tipo |
|-------|-------------|------|
| Número de partidas | Total de partidas jugadas en la sesión | Número entero |
| Número de partidas con ganador | Partidas que tuvieron un ganador definido | Número entero |
| Número de partidas empates | Partidas declaradas como empate | Número entero |
| Total de apuestas acumulado | Suma acumulada = `valor_apuesta × participantes_activos` por cada partida | Monto con 2 decimales |
| Participantes activos en partida actual | Cantidad de participantes con estado Activo en tiempo real | Número entero |
| Valor total apuesta partida actual | `valor_apuesta × participantes_activos` | Monto con 2 decimales |

### 4.2 Por Participante
Cada vez que se finaliza una partida, se actualizan los valores del participante según su estado:

| Campo | Descripción | Fórmula / Comportamiento |
|-------|-------------|--------------------------|
| Partidas ganadas | Se incrementa +1 si es declarado ganador | Contador |
| Partidas perdidas | Se incrementa +1 si no es ganador ni empate | Contador |
| Valores ganados | Si gana: `valor_apuesta × (cantidad_activos - 1)`<br>Si empata: `+ valor_apuesta` | Monto con 2 decimales |
| Valores perdidos | Si pierde: `+ valor_apuesta`<br>Si empata: `+ valor_apuesta` | Monto con 2 decimales |
| Valor apuesta en grilla | Si Activo = valor_apuesta<br>Si Suspendido = $0.00 | Monto con 2 decimales |

> **Nota:** Columna "Partidas Empatadas" y "Saldo" retiradas de visualización.

---

## 5. Interfaz — Elementos Visuales
- **Cabecera:**
  - Número de sesión
  - Texto fijo: "Apuesta Individual: $0.50"
  - Indicador de partida activa
- **Tarjeta de Último Resultado:**
  - Si existe partida finalizada: muestra "Ganador: [Nombre]" en color verde con ícono de trofeo
  - Si fue empate: muestra "Empate en la partida anterior" en color dorado con ícono
  - Si no hay partidas finalizadas: esta tarjeta no se muestra
- **Tarjeta de Resumen de Sesión:**
  - Total de partidas jugadas
  - Partidas con ganador
  - Partidas empatadas
  - Total acumulado de apuestas en la sesión
- **Lista de participantes — Columnas:**
  - Nombre
  - Estado (Activo/Suspendido) — indicador de color
  - G = Partidas ganadas
  - P = Partidas perdidas
  - Apuesta = Valor individual — Activo → monto completo / Suspendido → $0.00
  - Botón de acción: Suspender / Reactivar
- **Pie de grilla (totalizador):**
  - Ubicado inmediatamente después de la lista, sin espaciado excesivo
  - Formato en una sola línea: "Participantes: [cantidad]   Total Apuestas: [monto]"
  - Valor total de apuestas = `valor_apuesta × participantes_activos`
- **Botón Principal:**
  - "Finalizar Partida" — habilitado solo si hay partida en curso
- **Modal de Cierre de Partida:**
  - Opción "Empate"
  - Lista de participantes activos para seleccionar ganador
  - Botones: Cancelar / Confirmar
- **Resumen de Sesión incluye:**
  - Último resultado: "Último: [Nombre] — Ganó [monto]" o "Último: Empate"

---

## 6. Definición de Tipos
```typescript
type EstadoParticipanteEnSesion = 'Activo' | 'Suspendido';

type ParticipanteSesion = {
  participanteId: string;
  nombre: string;
  estadoEnSesion: EstadoParticipanteEnSesion;
  partidasGanadas: number;
  partidasPerdidas: number;
  valoresGanados: number;
  valoresPerdidos: number;
};

type Partida = {
  id: string;
  numero: number;
  estado: 'EnCurso' | 'Finalizada';
  ganadorId: string | null;
  esEmpate: boolean;
};

type SesionDatos = {
  numero: number;
  valorApuesta: number;
  estado: 'Activa' | 'Cerrada';
  totalPartidas: number;
  partidasConGanador: number;
  partidasEmpatadas: number;
  totalApuestas: number;
};

## 7. Historial de Cambios
Versión	Fecha	Descripción del Cambio	Autor
1.3	07/10/2026	• Cabecera: texto "Apuesta Individual: $0.50"
• Columna Apuesta: $0.00 para suspendidos
• Pie de grilla con total participantes y valor total apuestas	—
1.2	07/10/2026	• Exhibir ganador de última partida o indicar empate en pantalla	—
1.1	07/10/2026	• Creación automática de partida al cargar pantalla si no existe
• Eliminado botón "Iniciar Partida"
• Eliminada columna "Partidas Empatadas" de lista de participantes
• Reemplazada columna "Saldo" por "Valor Apuesta"	—
1.0	07/10/2026	Documentación inicial completa	—