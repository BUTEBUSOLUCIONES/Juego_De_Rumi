# Sistema de Gestión Escolar
Sistema integral de gestión académica, seguridad y estadística para instituciones educativas.

---

## 📋 Índice
1. [Descripción General](#1-descripción-general)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Requisitos del Sistema](#3-requisitos-del-sistema)
4. [Configuración del Entorno](#4-configuración-del-entorno)
5. [Guía de Instalación](#5-guía-de-instalación)
6. [Estándares de Desarrollo](#6-estándares-de-desarrollo)
7. [Seguridad](#7-seguridad)
8. [Despliegue y Distribución](#8-despliegue-y-distribución)
9. [Módulos del Sistema](#9-módulos-del-sistema)
10. [Mantenimiento y Soporte](#10-mantenimiento-y-soporte)

---

## 1. Descripción General

### Propósito
Sistema web responsivo tipo PWA que integra:
- Gestión de personal, estudiantes y docentes
- Distribución académica con control de horarios y carga laboral
- Registro de asistencia (estudiantes y docentes)
- Calificaciones y estadísticas
- Control de acceso con roles y permisos
- Reportes y métricas institucionales
- Todos los nombres de los archivos deben estar estrictamente en español
- Todos los nombres de variables funciones metodos deben estar estrictamente español
- Todos los archivos creados deben tener en su encabezado la ruta absoluta y el nombre del archivo real
- Todos los archivos creados deben tener un encabezado con una breve descripcion de que hace
- Todos los archivos creados deben tener en cada funcion un comentario de lo que hace 

### Tecnologías
| Componente | Versión recomendada |
|---|---|
| **Base de Datos** | PostgreSQL 15+ |
| **Backend** | Python 3.11+ / FastAPI |
| **Frontend** | React 18+ / Vite |
| **Autenticación** | JWT / bcrypt |
| **Empaquetado** | PWA — vite-plugin-pwa |
| **Control de Versiones** | Git / GitHub |

---

## 2. Estructura del Proyecto
sistema-gestion-escolar/
├── .github/
│ └── workflows/ # CI/CD — despliegue automático
├── docs/
│ ├── manual-usuario.md
│ ├── manual-admin.md
│ └── CHANGELOG.md
├── backend/
│ ├── app/
│ │ ├── init.py
│ │ ├── main.py # Punto de entrada
│ │ ├── config.py # Variables de entorno
│ │ ├── models/ # Modelos de datos
│ │ ├── schemas/ # Validación de entradas
│ │ ├── routers/ # Endpoints por módulo
│ │ ├── core/ # Seguridad, auth, utilidades
│ │ └── db.py # Conexión BD
│ ├── tests/ # Pruebas unitarias
│ ├── requirements.txt
│ ├── .env.example
│ └── .gitignore
├── frontend/
│ ├── public/
│ │ ├── manifest.json # Configuración PWA
│ │ └── icons/
│ ├── src/
│ │ ├── main.jsx
│ │ ├── App.jsx
│ │ ├── pages/ # Vistas
│ │ ├── components/ # Componentes reutilizables
│ │ ├── services/ # Llamadas a API
│ │ ├── hooks/ # Hooks personalizados
│ │ ├── context/ # Estado global
│ │ └── utils/ # Funciones auxiliares
│ ├── index.html
│ ├── vite.config.js
│ ├── package.json
│ └── .env
├── .gitignore
├── README.md
└── LICENSE


---

## 3. Requisitos del Sistema

### Entorno de Desarrollo
- Sistema Operativo: Windows 10+/Ubuntu 22.04+/macOS 13+
- Memoria RAM: Mínimo 4 GB recomendado
- Espacio en disco: 2 GB libre mínimo
- Conexión a internet: Para instalación de dependencias

### Software Necesario
| Herramienta | Versión | Comando de verificación |
|---|---|---|
| Python | ≥ 3.11 | `python --version` |
| Node.js | ≥ 18.x | `node --version` |
| PostgreSQL | ≥ 15 | `psql --version` |
| Git | Última estable | `git --version` |
| VS Code | Última | — |

### Extensiones Recomendadas para VS Code
- ESLint + Prettier — Formato de código
- Python — Soporte oficial
- Pylance — Intellisense
- PostgreSQL — Conexión directa desde editor
- Markdown All in One — Documentación
- GitLens — Historial de cambios

---

## 4. Configuración del Entorno

### Variables de Entorno — Backend (`.env`)
```env
# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_bd

# Seguridad
SECRET_KEY=generar_clave_aleatoria_larga_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Encriptación de datos sensibles
ENCRYPTION_KEY=clave_externa_no_guardar_en_bd

# Entorno
ENVIRONMENT=development  # production
DEBUG=true


Variables de Entorno — Frontend (.env)
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Sistema de Gestión Escolar
VITE_VERSION=1.0.0

Archivos de Configuración Clave
Archivo	Propósito
backend/requirements.txt	Dependencias de Python
frontend/package.json	Dependencias de Node/React
frontend/vite.config.js	Build, PWA, servidor
backend/app/config.py	Carga y validación de variables

5. Guía de Instalación
5.1 Clonar Repositorio
git clone <url-del-repositorio>
cd sistema-gestion-escolar

5.2 Base de Datos
# Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE colegio_db;"

# Ejecutar script de estructura
psql -U usuario -d colegio_db -f docs/bd/estructura.sql

# Cargar datos iniciales
psql -U usuario -d colegio_db -f docs/bd/datos_iniciales.sql


5.3 Backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables
cp .env.example .env
# Editar .env con valores reales

# Iniciar servidor
uvicorn app.main:app --reload

API disponible en: http://localhost:8000
Documentación automática: http://localhost:8000/docs
5.4 Frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Generar versión de producción
npm run build

plicación disponible en: http://localhost:5173
6. Estándares de Desarrollo
Convenciones de Código
Python: PEP 8 — formato con black y validación con flake8
JavaScript/React: ESLint + Prettier — indentación 2 espacios
Nombres:
Carpetas: minúsculas con guion (modulo-asistencia)
Componentes: PascalCase (ListaEstudiantes.jsx)
Funciones/variables: camelCase (obtenerCalificaciones)
Constantes: MAYÚSCULAS (MAX_CUPO)
Flujo de Trabajo con Git
Crear rama desde develop: git checkout -b modulo-nombre
Desarrollar y confirmar cambios: mensajes claros
Solicitar integración hacia develop mediante Pull Request
Versiones estables hacia main con etiqueta (v1.0.0)
Convenciones de Commits
plaintext
tipo: descripción corta

Tipos:
- feat: nueva funcionalidad
- fix: corrección de error
- docs: cambios en documentación
- refactor: reestructuración sin cambiar funcionalidad
- test: adición o modificación de pruebas

7. Seguridad
Políticas
Contraseñas almacenadas como HASH con bcrypt — nunca en texto plano
Datos sensibles encriptados en base de datos (identificación, contacto, salud)
Claves y contraseñas NUNCA incluidas en el repositorio
Acceso por roles y permisos — cada acción valida autorización
Sesiones con tiempo de expiración — cierre automático por inactividad
Validación de todas las entradas antes de procesar
Archivos Excluidos del Repositorio
Asegurar que .gitignore incluya:
Archivos .env
Entornos virtuales (venv/, node_modules/)
Carpeta dist/ de compilación
Archivos de configuración personal del editor (.vscode/ — salvo configuración compartida)

8. Despliegue y Distribución
Plataforma
PWA: Aplicación web responsiva — acceso desde cualquier navegador moderno
HTTPS obligatorio con certificado válido (Let's Encrypt — gratuito)
No se requiere publicar en tiendas de aplicaciones
Servidor Mínimo Recomendado
2 núcleos CPU / 2 GB RAM / 20 GB SSD
Ubuntu 22.04 LTS o distribución estable
Nginx como servidor web y proxy inverso
Copias de seguridad automáticas diarias
Distribución a Usuarios
Acceso mediante navegador desde la dirección oficial del sistema
Opción "Instalar aplicación" disponible desde el navegador
Cuentas creadas por administrador con credenciales individuales
Correo de bienvenida con guía de primer acceso al crear usuario

9. Módulos del Sistema
Tabla
Módulo	Funcionalidad Principal
Seguridad	Usuarios, roles, permisos, recuperación de contraseña
Personas	Registro y mantenimiento de datos personales
Estudiantes	Matriculación, historial, representantes
Docentes	Perfil, carga horaria, asignación de materias
Académico	Cursos, materias, períodos, distribución de horarios
Asistencia	Registro diario de estudiantes y personal
Calificaciones	Ingreso, consulta y cierre de notas por período
Estadísticas	Indicadores de rendimiento, asistencia y cumplimiento
Reportes	Generación y exportación de documentos institucionales

10. Mantenimiento y Soporte
Tareas Periódicas
Frecuencia	Acción
Diaria	Verificar copias de seguridad
Semanal	Revisar registros de errores y accesos
Mensual	Actualizar dependencias y revisar rendimiento
Por período	Cierre de calificaciones y generación de reportes
Versiones y Actualizaciones
Seguimiento de cambios en docs/CHANGELOG.md
Versionado semántico: v.MAYOR.MENOR.PARCHE
Pruebas en entorno de preproducción antes de publicar

11  Historial de Cambios 
Documentación del Proyecto — Versión 1.0
Última actualización: 13/10/2026
plaintext