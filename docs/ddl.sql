-- TPI Prode - Script DDL (identificadores en espanol). Ejecutar en PostgreSQL.

CREATE DATABASE prode_db;
\c prode_db

CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(10) NOT NULL DEFAULT 'USER',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE equipos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fechas (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partidos (
  id BIGSERIAL PRIMARY KEY,
  fecha_id BIGINT NOT NULL REFERENCES fechas(id),
  equipo_local_id BIGINT NOT NULL REFERENCES equipos(id),
  equipo_visitante_id BIGINT NOT NULL REFERENCES equipos(id),
  hora_inicio TIMESTAMPTZ NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'POR_JUGARSE',
  goles_local INT,
  goles_visitante INT,
  ganador VARCHAR(10),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (equipo_local_id <> equipo_visitante_id)
);

CREATE TABLE pronosticos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  partido_id BIGINT NOT NULL REFERENCES partidos(id),
  goles_local_pron INT NOT NULL,
  goles_visitante_pron INT NOT NULL,
  puntos_obtenidos INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, partido_id)
);

CREATE TABLE grupos (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_invitacion VARCHAR(10) UNIQUE NOT NULL,
  propietario_id BIGINT NOT NULL REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE miembros_grupo (
  id BIGSERIAL PRIMARY KEY,
  grupo_id BIGINT NOT NULL REFERENCES grupos(id),
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
  unido_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grupo_id, usuario_id)
);

-- Indices recomendados
CREATE INDEX idx_partidos_hora_inicio ON partidos(hora_inicio);
CREATE INDEX idx_pronosticos_partido ON pronosticos(partido_id);
CREATE INDEX idx_pronosticos_usuario ON pronosticos(usuario_id);
CREATE INDEX idx_miembros_grupo_grupo ON miembros_grupo(grupo_id);
