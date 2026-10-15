# Módulo de Sesiones — Plan de Pruebas
## Ubicación del documento
`D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\docs\PRUEBAS_SESIONES.md`

## Ubicación del código a probar
`D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\Sesiones.tsx`

## 📋 ÍNDICE
1. [Pre-requisitos](#1-pre-requisitos)
2. [Prueba 1 — Navegación y Pantalla Principal](#2-prueba-1--navegación-y-pantalla-principal)
3. [Prueba 2 — Crear Sesión con Valor Predefinido](#3-prueba-2--crear-sesión-con-valor-predefinido)
4. [Prueba 3 — Crear Sesión con Valor Personalizado](#4-prueba-3--crear-sesión-con-valor-personalizado)
5. [Prueba 4 — Validaciones del Formulario](#5-prueba-4--validaciones-del-formulario)
6. [Prueba 5 — Visualización y Orden en Grilla](#6-prueba-5--visualización-y-orden-en-grilla)
7. [Prueba 6 — Eliminación de Sesión](#7-prueba-6--eliminación-de-sesión)
8. [Prueba 7 — Detalle y Cambio de Estado](#8-prueba-7--detalle-y-cambio-de-estado)
9. [Registro de Resultados](#9-registro-de-resultados)

---
## 1. Pre-requisitos
| Requisito | Detalle |
|-----------|---------|
| Entorno | VS Code — Carpeta: `D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi` |
| Servidor activo | Ejecutar en terminal: `npx expo start --clear` |
| Dispositivo móvil | Con Expo Go conectado a la misma red WiFi |
| Pantalla base | Pantalla de Inicio: `D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\PantallaInicio.tsx` |
| Estado inicial | Sin sesiones creadas |

---
## 2. Prueba 1 — Navegación y Pantalla Principal
**Objetivo:** Verificar acceso, encabezados y retorno a Inicio.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Tocar opción **Sesiones** en Pantalla de Inicio | Se abre la lista de sesiones ✅ | ☐ Sí ☐ No |
| 2 | Verificar encabezados de la grilla | Se muestran: `N° · Fecha/Hora · Apuesta · Part. · Estado · (vacío)` ✅ | ☐ Sí ☐ No |
| 3 | Tocar flecha ← arriba a la izquierda | Regresa a Pantalla de Inicio ✅ | ☐ Sí ☐ No |
| 4 | Volver a entrar en Sesiones | La pantalla carga sin errores ✅ | ☐ Sí ☐ No |

---
## 3. Prueba 2 — Crear Sesión con Valor Predefinido
**Objetivo:** Crear sesión seleccionando un valor de la lista.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Tocar botón **"Nueva Sesión"** | Se abre el formulario modal ✅ | ☐ Sí ☐ No |
| 2 | Revisar Fecha y Descripción | Son generadas automáticamente, no se pueden editar ✅ | ☐ Sí ☐ No |
| 3 | En Valor de Apuesta → seleccionar **0.50** | Se muestra `0.50` en el campo ✅ | ☐ Sí ☐ No |
| 4 | Seleccionar **3 participantes** de la lista | Quedan marcados con visto ✅ | ☐ Sí ☐ No |
| 5 | Tocar **"Crear Sesión"** | Se cierra el modal y aparece en la grilla ✅ | ☐ Sí ☐ No |
| 6 | Verificar registro en la grilla | N° 1 · Fecha formato `dd-mm-aaaa hhmm` · Apuesta `0.50` · Part. `3` · Estado `Activa` ✅ | ☐ Sí ☐ No |

---
## 4. Prueba 3 — Crear Sesión con Valor Personalizado
**Objetivo:** Ingresar manualmente un monto con 2 decimales.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Tocar **"Nueva Sesión"** | Modal abierto ✅ | ☐ Sí ☐ No |
| 2 | En Valor de Apuesta → elegir opción libre | Campo editable activo ✅ | ☐ Sí ☐ No |
| 3 | Escribir: **0.75** | Acepta el valor con 2 decimales ✅ | ☐ Sí ☐ No |
| 4 | Seleccionar **5 participantes** | Todos seleccionados ✅ | ☐ Sí ☐ No |
| 5 | Crear sesión | Aparece arriba de la anterior (orden descendente) ✅ | ☐ Sí ☐ No |
| 6 | Verificar | N° 2 arriba, N° 1 abajo ✅ | ☐ Sí ☐ No |

---
## 5. Prueba 4 — Validaciones del Formulario
**Objetivo:** Comprobar que no se guarden datos incorrectos.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Nueva Sesión → sin seleccionar participantes → intentar crear | Mensaje: mínimo 3 participantes ✅ | ☐ Sí ☐ No |
| 2 | Seleccionar 2 participantes → intentar crear | Bloquea guardar ✅ | ☐ Sí ☐ No |
| 3 | Valor de apuesta → escribir `0` → intentar crear | Rechaza: debe ser mayor a 0 ✅ | ☐ Sí ☐ No |
| 4 | Escribir `0.123` → intentar crear | Rechaza: máximo 2 decimales ✅ | ☐ Sí ☐ No |
| 5 | Escribir en blanco → intentar crear | Rechaza: valor requerido ✅ | ☐ Sí ☐ No |
| 6 | Seleccionar valor `1.00` + 3 participantes → crear | Se guarda correctamente ✅ | ☐ Sí ☐ No |

---
## 6. Prueba 5 — Visualización y Orden en Grilla
**Objetivo:** Confirmar orden descendente y formato.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Crear sesión nueva (N° 4) | Aparece **siempre arriba** de las anteriores ✅ | ☐ Sí ☐ No |
| 2 | Revisar formato de fecha | `dd-mm-aaaa hhmm` → ej: `07-10-2026 11h55` ✅ | ☐ Sí ☐ No |
| 3 | Columna `Part.` | Muestra número, no se corta en pantalla ✅ | ☐ Sí ☐ No |
| 4 | Columna `Apuesta` | Siempre con 2 decimales: `0.20`, `1.00` ✅ | ☐ Sí ☐ No |
| 5 | Encabezado Acciones | Sin título, solo ícono de papelera ✅ | ☐ Sí ☐ No |
| 6 | Usar buscador → escribir parte de la descripción | Filtra y muestra solo coincidencias ✅ | ☐ Sí ☐ No |

---
## 7. Prueba 6 — Eliminación de Sesión
**Objetivo:** Regla: se elimina si NO tiene partidas.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Seleccionar sesión **sin partidas** asignadas → tocar ícono eliminar | Pide confirmación → al aceptar desaparece ✅ | ☐ Sí ☐ No |
| 2 | Simular sesión con partida (prueba lógica) → intentar eliminar | Mensaje: *"Tiene partidas asociadas. No es posible eliminarla."* ✅ | ☐ Sí ☐ No |
| 3 | Confirmar participantes asignados | No bloquean eliminación, solo importan las partidas ✅ | ☐ Sí ☐ No |

---
## 8. Prueba 7 — Detalle y Cambio de Estado
**Objetivo:** Ver detalle y suspender/reactivar participantes.

| Paso | Acción a realizar | Resultado esperado | ¿Cumple? |
|------|-------------------|--------------------|----------|
| 1 | Tocar fila de una sesión | Abre detalle con lista de participantes ✅ | ☐ Sí ☐ No |
| 2 | Revisar contadores | `Total: X | Activos: Y | Suspendidos: Z` ✅ | ☐ Sí ☐ No |
| 3 | Tocar **Suspender** en un participante | Pasa a estado Suspendido (color cambia) ✅ | ☐ Sí ☐ No |
| 4 | Intentar suspender cuando quedan solo 3 activos | Mensaje: mínimo 3 activos ✅ | ☐ Sí ☐ No |
| 5 | Tocar **Reactivar** en un suspendido | Vuelve a Activo ✅ | ☐ Sí ☐ No |
| 6 | Tocar flecha ← volver a lista | Los cambios quedan guardados ✅ | ☐ Sí ☐ No |

---
## 9. Registro de Resultados
| Módulo | Versión | Fecha Prueba | Resultado General | Observaciones |
|--------|---------|--------------|-------------------|---------------|
| Sesiones | 1.6 | 07-10-2026 | ☐ Aprobado ☐ Con Observaciones ☐ Requiere Corrección | |

**Pruebas realizadas por:** __________________________
**Firma / Confirmación:** __________________________

---
## ✅ Instrucciones de uso:
1. Copia este contenido en: `D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\docs\PRUEBAS_SESIONES.md`
2. Guarda con **Control + S**
3. Sigue las pruebas **una por una** marcando con ☑
4. Si alguna falla → anota el número de prueba y el mensaje que aparece en el móvil
5. Avísame y corregimos de inmediato 💪

¿Listo para empezar las pruebas? 🚀