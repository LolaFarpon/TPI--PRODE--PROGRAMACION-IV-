-- ════════════════════════════════════════════════════════════════════════
-- test_data.sql — Datos de prueba para la demo de PRODE
-- Ejecutar sobre una base LIMPIA (las tablas ya creadas por el backend).
-- Pensado para PostgreSQL.
--
-- Usuarios y contraseñas:
--   admin@prode.com  / admin123   (ADMIN)
--   lu@prode.com     / lu12345    (USER)
--   guada@prode.com  / guada123   (USER)
--   lola@prode.com   / lola123    (USER)
--   vicky@prode.com  / vicky123   (USER)
--
-- Las contraseñas están hasheadas con BCrypt ($2a$), que es lo que valida
-- el backend. NO hace falta registrarlos de nuevo: ya podés loguearte.
-- ════════════════════════════════════════════════════════════════════════

-- Si querés re-ejecutar sobre datos existentes, descomentá este bloque:
-- TRUNCATE miembros_grupo, grupos, pronosticos, partidos, fechas, equipos, usuarios RESTART IDENTITY CASCADE;

-- ── Usuarios ──────────────────────────────────────────────────────────────
INSERT INTO usuarios (nombre_usuario, email, contrasena_hash, rol, creado_en) VALUES
('admin', 'admin@prode.com', '$2a$12$CDPgLdfnAM9ICtGl/2fEl.R2A/Ll19W78ZJ/x3VOATEEm76usifIO', 'ADMIN', now()),
('lu',    'lu@prode.com',    '$2a$12$38s3YoorrIgFKHBQSErSduuQhyHwPfBEeh9kx8vrnLYgcDckb/qUa', 'USER',  now()),
('guada', 'guada@prode.com', '$2a$12$EpLhIN935tdBAqe9HuXZzepQzyPrsWWWaOkEV6Rq59PyEjtW5Ykv2', 'USER',  now()),
('lola',  'lola@prode.com',  '$2a$12$qHnspsD.IC89JT/HKNhBHOLhSWFmB5JbLlO1.vSLTrhKvGQBl.FMm', 'USER',  now()),
('vicky', 'vicky@prode.com', '$2a$12$BnAYidalc7k4MhnqkET4T.N0yD.4DIA7DCAp6wsuN8H5BeZEu0eAC', 'USER',  now());

-- ── Equipos ───────────────────────────────────────────────────────────────
INSERT INTO equipos (nombre, creado_en) VALUES
('Boca Juniors', now()),
('River Plate', now()),
('Talleres', now()),
('Belgrano', now()),
('Racing', now()),
('Independiente', now());

-- ── Fechas / Jornadas ─────────────────────────────────────────────────────
-- Fecha 1 ya terminó (la usamos para que el leaderboard tenga datos).
-- Fecha 2 está por jugarse (la usamos para la demo en vivo).
INSERT INTO fechas (nombre, estado, creado_en) VALUES
('Fecha 1 - Fase de Grupos', 'FINALIZADA', now()),
('Fecha 2 - Fase de Grupos', 'PROGRAMADA', now());

-- ── Partidos de la Fecha 1 (FINALIZADOS) ──────────────────────────────────
-- Boca 2 - 1 River  (ganó LOCAL)
INSERT INTO partidos (fecha_id, equipo_local_id, equipo_visitante_id, hora_inicio, estado, goles_local, goles_visitante, ganador, creado_en)
VALUES (
  (SELECT id FROM fechas  WHERE nombre = 'Fecha 1 - Fase de Grupos'),
  (SELECT id FROM equipos WHERE nombre = 'Boca Juniors'),
  (SELECT id FROM equipos WHERE nombre = 'River Plate'),
  now() - interval '7 days', 'FINALIZADO', 2, 1, 'LOCAL', now() - interval '8 days');

-- Talleres 0 - 0 Belgrano  (EMPATE)
INSERT INTO partidos (fecha_id, equipo_local_id, equipo_visitante_id, hora_inicio, estado, goles_local, goles_visitante, ganador, creado_en)
VALUES (
  (SELECT id FROM fechas  WHERE nombre = 'Fecha 1 - Fase de Grupos'),
  (SELECT id FROM equipos WHERE nombre = 'Talleres'),
  (SELECT id FROM equipos WHERE nombre = 'Belgrano'),
  now() - interval '7 days', 'FINALIZADO', 0, 0, 'EMPATE', now() - interval '8 days');

-- ── Partidos de la Fecha 2 (POR JUGARSE, en el futuro) ─────────────────────
INSERT INTO partidos (fecha_id, equipo_local_id, equipo_visitante_id, hora_inicio, estado, creado_en)
VALUES (
  (SELECT id FROM fechas  WHERE nombre = 'Fecha 2 - Fase de Grupos'),
  (SELECT id FROM equipos WHERE nombre = 'Racing'),
  (SELECT id FROM equipos WHERE nombre = 'Independiente'),
  now() + interval '2 days', 'POR_JUGARSE', now());

INSERT INTO partidos (fecha_id, equipo_local_id, equipo_visitante_id, hora_inicio, estado, creado_en)
VALUES (
  (SELECT id FROM fechas  WHERE nombre = 'Fecha 2 - Fase de Grupos'),
  (SELECT id FROM equipos WHERE nombre = 'Boca Juniors'),
  (SELECT id FROM equipos WHERE nombre = 'Talleres'),
  now() + interval '3 days', 'POR_JUGARSE', now());

INSERT INTO partidos (fecha_id, equipo_local_id, equipo_visitante_id, hora_inicio, estado, creado_en)
VALUES (
  (SELECT id FROM fechas  WHERE nombre = 'Fecha 2 - Fase de Grupos'),
  (SELECT id FROM equipos WHERE nombre = 'River Plate'),
  (SELECT id FROM equipos WHERE nombre = 'Belgrano'),
  now() + interval '4 days', 'POR_JUGARSE', now());

-- ── Pronósticos de la Fecha 1 (con puntos ya calculados) ───────────────────
-- Partido Boca 2-1 River:
--   lu 2-1 = exacto (3) · guada 1-0 = tendencia (1) · lola 0-2 = nada (0) · vicky 3-1 = tendencia (1)
-- Partido Talleres 0-0 Belgrano:
--   lu 1-1 = tendencia (1) · guada 0-0 = exacto (3) · lola 2-2 = tendencia (1) · vicky 1-0 = nada (0)
-- Totales: lu 4 · guada 4 · lola 1 · vicky 1
-- Desempate lu vs guada (4 y 4, 1 exacto c/u): gana lu por pronóstico más antiguo.

-- Atajos para no repetir las subconsultas largas:
-- (usamos los nombres de los equipos para encontrar cada partido)

-- Boca vs River
INSERT INTO pronosticos (usuario_id, partido_id, goles_local_pron, goles_visitante_pron, puntos_obtenidos, creado_en) VALUES
((SELECT id FROM usuarios WHERE email='lu@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Boca Juniors' AND ev.nombre='River Plate'),
 2, 1, 3, now() - interval '6 hours'),
((SELECT id FROM usuarios WHERE email='guada@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Boca Juniors' AND ev.nombre='River Plate'),
 1, 0, 1, now() - interval '5 hours'),
((SELECT id FROM usuarios WHERE email='lola@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Boca Juniors' AND ev.nombre='River Plate'),
 0, 2, 0, now() - interval '4 hours'),
((SELECT id FROM usuarios WHERE email='vicky@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Boca Juniors' AND ev.nombre='River Plate'),
 3, 1, 1, now() - interval '3 hours');

-- Talleres vs Belgrano
INSERT INTO pronosticos (usuario_id, partido_id, goles_local_pron, goles_visitante_pron, puntos_obtenidos, creado_en) VALUES
((SELECT id FROM usuarios WHERE email='lu@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Talleres' AND ev.nombre='Belgrano'),
 1, 1, 1, now() - interval '6 hours'),
((SELECT id FROM usuarios WHERE email='guada@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Talleres' AND ev.nombre='Belgrano'),
 0, 0, 3, now() - interval '5 hours'),
((SELECT id FROM usuarios WHERE email='lola@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Talleres' AND ev.nombre='Belgrano'),
 2, 2, 1, now() - interval '4 hours'),
((SELECT id FROM usuarios WHERE email='vicky@prode.com'),
 (SELECT p.id FROM partidos p JOIN equipos el ON p.equipo_local_id=el.id JOIN equipos ev ON p.equipo_visitante_id=ev.id WHERE el.nombre='Talleres' AND ev.nombre='Belgrano'),
 1, 0, 0, now() - interval '3 hours');

-- ── Un grupo de ejemplo ("La Peña") con lu como dueña y guada adentro ───────
INSERT INTO grupos (nombre, codigo_invitacion, propietario_id, creado_en) VALUES
('La Peña', 'PRODE01', (SELECT id FROM usuarios WHERE email='lu@prode.com'), now());

INSERT INTO miembros_grupo (grupo_id, usuario_id, unido_en) VALUES
((SELECT id FROM grupos WHERE codigo_invitacion='PRODE01'), (SELECT id FROM usuarios WHERE email='lu@prode.com'),    now()),
((SELECT id FROM grupos WHERE codigo_invitacion='PRODE01'), (SELECT id FROM usuarios WHERE email='guada@prode.com'), now());

-- Listo. Entrá con admin@prode.com / admin123 para gestionar, o con
-- lu@prode.com / lu12345 para jugar. El código del grupo "La Peña" es PRODE01.
