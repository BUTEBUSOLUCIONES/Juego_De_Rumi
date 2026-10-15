# main.py — SERVIDOR COMPLETO CON HISTORIAL DE SINCRONIZACIÓN
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List

app = FastAPI(title="Sincronización Rumi", version="3.0.0")

# ==============================================================
# CONEXIÓN A BASE DE DATOS
# ==============================================================
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="partidas_rumi",
        user="postgres",
        password="postgres",  # ← Actualiza con tu contraseña real
        port=5432
    )

# ==============================================================
# FUNCIONES DE HISTORIAL DE SINCRONIZACIÓN
# ==============================================================
def registrar_inicio_sincronizacion(
    conn,
    nombre_tabla: str,
    registros_enviados: int = 0
) -> int:
    """Registra el inicio de una sincronización y devuelve su ID"""
    cursor = conn.cursor()
    fecha_inicio = datetime.now()
    cursor.execute("""
        INSERT INTO sincronizacion 
        (fecha_inicio, nombre_tabla, registros_enviados, registros_recibidos, estado)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (fecha_inicio, nombre_tabla, registros_enviados, 0, 'En proceso'))
    sincro_id = cursor.fetchone()[0]
    conn.commit()
    return sincro_id

def finalizar_sincronizacion(
    conn,
    sincro_id: int,
    registros_recibidos: int,
    estado: str = 'Completado'
) -> None:
    """Actualiza el registro con fecha de fin y resultado final"""
    cursor = conn.cursor()
    fecha_fin = datetime.now()
    cursor.execute("""
        UPDATE sincronizacion 
        SET fecha_fin = %s, registros_recibidos = %s, estado = %s
        WHERE id = %s
    """, (fecha_fin, registros_recibidos, estado, sincro_id))
    conn.commit()

# ==============================================================
# MODELOS DE ENTRADA
# ==============================================================
class SesionCreate(BaseModel):
    numero: int
    descripcion: str
    valorApuestaBase: float
    estado: str
    fechaCreacion: str
  # ✅ AGREGA ESTO 👇
    fechaCierre: Optional[str] = None

class ParticipanteCreate(BaseModel):
    id: str
    nombre: str
    estado: str
    actualizadoEn: str

class SesionParticipanteCreate(BaseModel):
    id: str
    sesionNumero: int
    participanteId: str
    estadoEnSesion: str
    partidasGanadas: int
    partidasPerdidas: int
    valoresGanados: float
    valoresPerdidos: float
    actualizadoEn: str

class PartidaCreate(BaseModel):
    id: str
    numero: int
    sesionNumero: int
    estado: str
    sincronizado: bool
    actualizadoEn: str

class EstadisticaCreate(BaseModel):
    id: str
    sesionNumero: int
    participanteId: str
    partidasGanadas: int
    partidasPerdidas: int
    valoresGanados: float
    valoresPerdidos: float
    saldo: float
    actualizadoEn: str

# ==============================================================
# ENDPOINT: SINCRONIZAR SESIÓN
# ==============================================================
@app.post("/api/sincronizar/sesion")
async def sincronizar_sesion(datos: SesionCreate):
    conn = get_db_connection()
    
    sincro_id = registrar_inicio_sincronizacion(conn, 'sesiones', 1)
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT numero FROM sesiones WHERE numero = %s", (datos.numero,))
        existe = cursor.fetchone()
        
        if existe:
            cursor.execute("""
            UPDATE sesiones 
            SET descripcion = %s, valor_apuesta_base = %s, estado = %s, fecha_cierre = %s
            WHERE numero = %s
            """, (
                    datos.descripcion,
                    datos.valorApuestaBase,
                    datos.estado,
                    datos.fechaCierre,   # ✅ AGREGADO
                    datos.numero
                ))
            resultado = 'actualizado'
        else:
            cursor.execute("""
                INSERT INTO sesiones (numero, descripcion, valor_apuesta_base, estado, fecha_creacion, fecha_cierre)
                VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                datos.numero,
                datos.descripcion,
                datos.valorApuestaBase,
                datos.estado,
                datos.fechaCreacion,
                datos.fechaCierre,   # ✅ AGREGADO
            ))
            resultado = 'nuevo'

        conn.commit()

        finalizar_sincronizacion(conn, sincro_id, 1, 'Completado')
        return {"estado": resultado, "numero": datos.numero}
        
    except Exception as e:
        conn.rollback()
        finalizar_sincronizacion(conn, sincro_id, 0, f'Error: {str(e)}')
        return {"error": str(e)}, 500
    finally:
        conn.close()

# ==============================================================
# ENDPOINT: SINCRONIZAR PARTICIPANTE
# ==============================================================
@app.post("/api/sincronizar/participante")
async def sincronizar_participante(datos: ParticipanteCreate):
    conn = get_db_connection()
    
    sincro_id = registrar_inicio_sincronizacion(conn, 'participantes', 1)
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM participantes WHERE id = %s", (datos.id,))
        existe = cursor.fetchone()
        
        if existe:
            cursor.execute("""
                UPDATE participantes 
                SET nombre = %s, estado = %s, actualizado_en = %s
                WHERE id = %s
            """, (datos.nombre, datos.estado, datos.actualizadoEn, datos.id))
            resultado = 'actualizado'
        else:
            cursor.execute("""
                INSERT INTO participantes (id, nombre, estado, actualizado_en)
                VALUES (%s, %s, %s, %s)
            """, (datos.id, datos.nombre, datos.estado, datos.actualizadoEn))
            resultado = 'nuevo'
        
        conn.commit()
        
        finalizar_sincronizacion(conn, sincro_id, 1, 'Completado')
        return {"estado": resultado, "id": datos.id}
        
    except Exception as e:
        conn.rollback()
        finalizar_sincronizacion(conn, sincro_id, 0, f'Error: {str(e)}')
        return {"error": str(e)}, 500
    finally:
        conn.close()

# ==============================================================
# ENDPOINT: SINCRONIZAR SESIÓN-PARTICIPANTE
# ==============================================================
@app.post("/api/sincronizar/sesion-participante")
async def sincronizar_sesion_participante(datos: SesionParticipanteCreate):
    conn = get_db_connection()
    
    sincro_id = registrar_inicio_sincronizacion(conn, 'sesiones_participantes', 1)
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id FROM sesiones_participantes 
            WHERE sesion_numero = %s AND participante_id = %s
        """, (datos.sesionNumero, datos.participanteId))
        existe = cursor.fetchone()
        
        if existe:
            cursor.execute("""
                UPDATE sesiones_participantes 
                SET estado_en_sesion = %s, partidas_ganadas = %s, partidas_perdidas = %s,
                    valores_ganados = %s, valores_perdidos = %s, actualizado_en = %s
                WHERE sesion_numero = %s AND participante_id = %s
            """, (datos.estadoEnSesion, datos.partidasGanadas, datos.partidasPerdidas,
                  datos.valoresGanados, datos.valoresPerdidos, datos.actualizadoEn,
                  datos.sesionNumero, datos.participanteId))
            resultado = 'actualizado'
        else:
            cursor.execute("""
                INSERT INTO sesiones_participantes 
                (id, sesion_numero, participante_id, estado_en_sesion,
                 partidas_ganadas, partidas_perdidas, valores_ganados, valores_perdidos, actualizado_en)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (datos.id, datos.sesionNumero, datos.participanteId, datos.estadoEnSesion,
                  datos.partidasGanadas, datos.partidasPerdidas,
                  datos.valoresGanados, datos.valoresPerdidos, datos.actualizadoEn))
            resultado = 'nuevo'
        
        conn.commit()
        
        finalizar_sincronizacion(conn, sincro_id, 1, 'Completado')
        return {"estado": resultado, "id": datos.id}
        
    except Exception as e:
        conn.rollback()
        finalizar_sincronizacion(conn, sincro_id, 0, f'Error: {str(e)}')
        return {"error": str(e)}, 500
    finally:
        conn.close()

# ==============================================================
# ENDPOINT: SINCRONIZAR PARTIDA
# ==============================================================
@app.post("/api/sincronizar/partida")
async def sincronizar_partida(datos: PartidaCreate):
    conn = get_db_connection()
    
    sincro_id = registrar_inicio_sincronizacion(conn, 'partidas', 1)
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM partidas WHERE id = %s", (datos.id,))
        existe = cursor.fetchone()
        
        if existe:
            cursor.execute("""
                UPDATE partidas 
                SET numero = %s, sesion_id = %s, estado = %s, sincronizado = %s, actualizado_en = %s
                WHERE id = %s
            """, (
                    datos.numero,
                    datos.sesionNumero,  # ✅ Este es el número de la sesión
                    datos.estado,
                    datos.sincronizado,
                    datos.actualizadoEn,
                    datos.id
                ))
            resultado = 'actualizado'
        else:
            cursor.execute("""
                INSERT INTO partidas 
                (id, numero, sesion_id, estado, sincronizado, actualizado_en)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                    datos.id,
                    datos.numero,
                    datos.sesionNumero,  # ✅ Aquí también
                    datos.estado,
                    datos.sincronizado,
                    datos.actualizadoEn
                ))
            resultado = 'nuevo'
        
        conn.commit()
        
        finalizar_sincronizacion(conn, sincro_id, 1, 'Completado')
        return {"estado": resultado, "id": datos.id}
        
    except Exception as e:
        conn.rollback()
        finalizar_sincronizacion(conn, sincro_id, 0, f'Error: {str(e)}')
        return {"error": str(e)}, 500
    finally:
        conn.close()

# ==============================================================
# ENDPOINT: SINCRONIZAR ESTADÍSTICA
# ==============================================================
@app.post("/api/sincronizar/estadistica")
async def sincronizar_estadistica(datos: EstadisticaCreate):
    conn = get_db_connection()
    
    sincro_id = registrar_inicio_sincronizacion(conn, 'estadisticas', 1)
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id FROM estadisticas 
            WHERE sesion_numero = %s AND participante_id = %s
        """, (datos.sesionNumero, datos.participanteId))
        existe = cursor.fetchone()
        
        if existe:
            cursor.execute("""
                UPDATE estadisticas 
                SET partidas_ganadas = %s, partidas_perdidas = %s, valores_ganados = %s,
                    valores_perdidos = %s, saldo = %s, actualizado_en = %s
                WHERE sesion_numero = %s AND participante_id = %s
            """, (datos.partidasGanadas, datos.partidasPerdidas, datos.valoresGanados,
                  datos.valoresPerdidos, datos.saldo, datos.actualizadoEn,
                  datos.sesionNumero, datos.participanteId))
            resultado = 'actualizado'
        else:
            cursor.execute("""
                INSERT INTO estadisticas 
                (id, sesion_numero, participante_id, partidas_ganadas, partidas_perdidas,
                 valores_ganados, valores_perdidos, saldo, actualizado_en)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (datos.id, datos.sesionNumero, datos.participanteId,
                  datos.partidasGanadas, datos.partidasPerdidas,
                  datos.valoresGanados, datos.valoresPerdidos,
                  datos.saldo, datos.actualizadoEn))
            resultado = 'nuevo'
        
        conn.commit()
        
        finalizar_sincronizacion(conn, sincro_id, 1, 'Completado')
        return {"estado": resultado, "id": datos.id}
        
    except Exception as e:
        conn.rollback()
        finalizar_sincronizacion(conn, sincro_id, 0, f'Error: {str(e)}')
        return {"error": str(e)}, 500
    finally:
        conn.close()

# ==============================================================
# ENDPOINT: DESCARGA DE NOVEDADES
# ==============================================================
@app.get("/api/sincronizar/actualizaciones")
async def obtener_actualizaciones(desde: str = "2000-01-01T00:00:00"):
    return {
        "nuevos": [],
        "mensaje": "Endpoint de descarga activo"
    }

# ==============================================================
# INICIAR SERVIDOR
# ==============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)