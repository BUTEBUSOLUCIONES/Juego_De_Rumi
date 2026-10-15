-- TABLA: Sesiones
CREATE TABLE IF NOT EXISTS sesiones (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    valor_apuesta_base DECIMAL(10,2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'Activa',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP
);

-- TABLA: Participantes
CREATE TABLE IF NOT EXISTS participantes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Activo',
    saldo DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- TABLA: Partidas
CREATE TABLE IF NOT EXISTS partidas (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    sesion_id INTEGER NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'Abierta',
    ganador_id TEXT REFERENCES participantes(id),
    tipo_terminacion TEXT,
    valor_ganancia DECIMAL(10,2) DEFAULT 0,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sincronizado BOOLEAN DEFAULT FALSE
);

-- TABLA: Sesiones_Participantes
CREATE TABLE IF NOT EXISTS sesiones_participantes (
    sesion_id INTEGER REFERENCES sesiones(id) ON DELETE CASCADE,
    participante_id TEXT REFERENCES participantes(id) ON DELETE CASCADE,
    PRIMARY KEY (sesion_id, participante_id)
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_partidas_sesion ON partidas(sesion_id);
CREATE INDEX IF NOT EXISTS idx_partidas_actualizado ON partidas(actualizado_en);