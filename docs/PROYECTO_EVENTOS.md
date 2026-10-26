# Sistema de Gestión de Eventos y Notificaciones desde Correo

## Historial de Cambios
| Versión | Fecha       | Descripción de Modificación |
|---------|-------------|------------------------------|
| 1.0     | 2026-10-21  | Versión inicial: definición de origen de datos, clasificación y modelo preliminar |
| 1.1     | 2026-10-21  | Eliminado campo cuerpo en tabla `notificaciones`; definidas 2 vías de carga; agregada config GitHub SSH solo en documentación |
| 1.2     | 2026-10-21  | Estructura de `eventos` derivada del análisis del cuerpo HTML; botón para carga automática; regla de unicidad; retirados accesos GitHub de la interfaz |
| 1.3     | 2026-10-21  | Agregado apartado de Historial/Control de Cambios; reforzado que la estructura de `eventos` se adapta dinámicamente al contenido de cada tipo de evento en el cuerpo HTML |
| 1.4     | 2026-10-21  | Agregado detalle de entorno ya instalado: PostgreSQL v12, Node, VS Code y Python |
| 1.5     | 2026-10-21  | Agregadas normas de codificación: comentarios con ruta absoluta, idioma español exclusivo en identificadores y comentarios, historial de cambios en cada archivo, comentarios al inicio y fin de cada función/método |

---

## Descripción General
Desarrollar una aplicación web y de escritorio utilizando **React** como framework de interfaz y **PostgreSQL v12** como sistema de gestión de base de datos. El sistema procesa eventos y sus notificaciones, obteniendo los datos desde carpetas locales de Thunderbird o directamente desde la cuenta de correo electrónico.

---

## Entorno Instalado
Las siguientes herramientas ya se encuentran instaladas y disponibles:
- ✅ **PostgreSQL v12** — Sistema de base de datos
- ✅ **Node.js** — Entorno de ejecución JavaScript
- ✅ **VS Code** — Editor de código
- ✅ **Python** — Lenguaje de programación
ademas se debe copiar la aplicacion web a la siguiente carpeta:
d:/servidor_web_python/apps/eventos
y de esa manera procesarlo por el navegador en base a esta url:
http://192.168.1.53:80007apps/eventos/index.html 


---

## 1. Origen de los Datos
- **Ruta de carpetas locales:** `D:\CORREOS_2025\Thunderbird_2025_07\Mail\Local Folders\`
- **Carpetas objetivo:** todas aquellas cuyo nombre inicia con el prefijo `ARECORDATORIOS`
- **Cuenta de correo:** `shalvitatole@gmail.com`
- **Antelación de notificaciones:** se reciben avisos con **5, 4, 3, 2, 1 y 0 días** antes de la fecha de cumplimiento del evento.

### Formas de Alimentar el Sistema
1. **Carga desde carpetas físicas:** lee directamente los archivos de las carpetas de Thunderbird en la ruta indicada. Opción visible y disponible en la interfaz.
2. **Carga automática desde cuenta de correo:** lee los correos que llegan a `shalvitatole@gmail.com`. Incluye un **botón en la interfaz** para ejecutar el proceso de carga automática bajo demanda.

> **Regla de Unicidad:** Los eventos son únicos y **no pueden registrarse por duplicado**. El sistema debe implementar lógica de detección y rechazo de duplicados al procesar correos o carpetas.

---

## 2. Clasificación de Eventos
Los eventos se dividen en 4 tipos exclusivos, cada uno con estructura propia derivada del análisis del cuerpo del mensaje en formato HTML:
- `CUMPLEAÑOS`
- `TAREAS`
- `CITAS_MEDICAS`
- `REUNIONES`

### Extracción Dinámica de Estructura
Al leer el **cuerpo HTML** del correo, el sistema identifica y extrae los campos específicos según el tipo de evento:
- Ejemplo para `CUMPLEAÑOS`: Nombre, Edad, Fecha de nacimiento, Lugar, Fecha y hora del evento, Observaciones.
- La estructura de campos **no es fija ni uniforme**: se adapta a la disposición real que presenta cada tipo de evento en su cuerpo HTML. Puede coincidir o diferir entre tipos; el sistema debe procesar y mapear los campos según el contenido de cada mensaje.

---

## 3. Modelo de Datos — PostgreSQL v12

### Tabla: `eventos`
Registro principal del evento. **La estructura de campos se define según el análisis del cuerpo HTML** de cada tipo de evento:

| Campo | Descripción |
|---|---|
| `id` | Identificador único |
| `tipo_evento` | `CUMPLEAÑOS`, `TAREAS`, `CITAS_MEDICAS`, `REUNIONES` |
| `fecha_evento` | Fecha y hora de cumplimiento del evento |
| `asunto_original` | Contenido completo del asunto tal como aparece en el correo |
| `cuerpo_html_original` | Cuerpo completo del mensaje en formato HTML (sin modificaciones) |
| `estructura_extraida` | Datos desglosados según el tipo de evento, obtenidos al interpretar el cuerpo HTML. Puede almacenarse en formato JSON o en campos específicos según la complejidad detectada |
| `mes` | Mes del evento — derivado de `fecha_evento` para consultas ágiles |
| `anio` | Año del evento — derivado de `fecha_evento` para consultas ágiles |
| `estado` | Estado de cumplimiento del evento |
| `fecha_creacion` | Fecha y hora de registro en el sistema |
| `origen` | `carpeta_local` o `cuenta_correo` según fuente de datos |

> **Importante:** La definición detallada de los campos contenidos en `estructura_extraida` se determina en tiempo de procesamiento, basándose en la disposición real de la información dentro del cuerpo HTML de cada tipo de evento.

### Tabla: `notificaciones`
Avisos asociados a cada evento:

| Campo | Descripción |
|---|---|
| `id` | Identificador único |
| `evento_id` | Clave foránea → `eventos.id` |
| `dias_antelacion` | Valor numérico: 5, 4, 3, 2, 1, 0 |
| `fecha_recepcion` | Fecha y hora en que se recibió el aviso |
| `asunto_notificacion` | Asunto específico de esta notificación |
| `origen` | `carpeta_local` o `cuenta_correo` |

> **Nota:** El cuerpo del correo **no se duplica** en esta tabla; se consulta desde la tabla `eventos`.

---

## 4. Consultas Requeridas
- Filtrar eventos **por tipo**
- Filtrar eventos **por mes y año**
- Listar **todos** los eventos registrados
- Combinaciones de los filtros anteriores

---

## 5. Visualización y Gráficos
- Cantidad de eventos **por tipo**
- Cantidad de eventos **por mes y año**
- Totales generales
- Distribución comparativa entre tipos, meses y años

---

## 6. Control de Versiones y Documentación
- La aplicación **NO incluye botones ni opciones de acceso a GitHub** dentro de su interfaz de usuario.
- La configuración de actualización del repositorio mediante **conexión SSH hacia GitHub** se describe únicamente en la documentación técnica del proyecto.
- Este documento constituye el **control de cambios** del sistema; toda modificación a los requisitos debe registrarse en la tabla del encabezado.

---

## 7. Normas de Codificación y Estilo — OBLIGATORIAS
Toda la base de código del proyecto debe cumplir estrictamente con lo siguiente:

### 7.1 Comentario de Ubicación en Cada Archivo
- Al inicio de **cada archivo** creado debe incluirse un comentario con:
  - Nombre completo del archivo
  - Extensión
  - Ruta absoluta donde se encuentra ubicado
- Ejemplo:
Archivo: lector_carpetas_correo.pyRuta absoluta: D:\proyectos\gestion_eventos\backend\lector_carpetas_correo.py


### 7.2 Idioma de Comentarios
- Todos los comentarios a nivel general del código deben estar **exclusivamente en idioma español**.

### 7.3 Nomenclatura — Todo en Español
- Cada nombre de:
- función
- método
- variable
- archivo
- **debe escribirse absolutamente en español**, sin abreviaturas no justificadas ni términos en inglés.
- Ejemplo correcto: `extraer_datos_desde_cuerpo_html()`
- Ejemplo incorrecto: `getDataFromHTML()`

### 7.4 Comentarios en Funciones y Métodos
- Cada función o método debe incluir:
- Comentario **al inicio** describiendo: propósito, parámetros que recibe y valor que retorna
- Comentario **al final** indicando cierre y ejecución concluida del bloque
- Ejemplo:
```python
def leer_carpetas_thunderbird(ruta_base):
    """
    Lee todas las carpetas de Thunderbird que inician con el prefijo ARECORDATORIOS.
    Parámetros:
        ruta_base: Ruta raíz donde se encuentran las carpetas locales
    Retorna:
        Lista con rutas completas de las carpetas encontradas
    """
    # ... código ...
    return lista_carpetas
# Fin de la función leer_carpetas_thunderbird

7.5 Historial de Cambios en Cada Archivo
Cada archivo del proyecto debe contener su propia tabla de historial de cambios en su encabezado, con:
Versión
Fecha
Descripción breve de la modificación realizada
8. Requisitos Técnicos
Interfaz: React (compatible con web y escritorio)
Base de datos: PostgreSQL v12 (ya instalado)
Plataforma: Windows (ruta en formato D:\...)
Código estructurado, comentado y mantenible
Editor: VS Code (ya instalado)
Entorno de ejecución: Node.js (ya instalado)
Procesamiento y lógica de extracción: Python (ya instalado)
Scripts SQL para creación de tablas y relaciones
Instrucciones de conexión a la base de datos
Documentación de despliegue y actualización con SSH hacia GitHub
Prevención de duplicidad de eventos
Lógica de extracción dinámica de campos desde cuerpo HTML
Cumplimiento total con las normas de codificación establecidas en el apartado 7
9. Notas Adicionales
La estructura de la tabla eventos está sujeta a la disposición real de la información que presenta cada tipo de evento en el cuerpo del mensaje en formato HTML.
Cualquier ajuste en el desglose de campos se basará en ejemplos concretos de los correos recibidos.
El incumplimiento de cualquiera de las normas de codificación del apartado 7 dará por no conforme el entregable.