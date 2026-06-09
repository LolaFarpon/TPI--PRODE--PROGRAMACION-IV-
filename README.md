# Prode TPI — Backend

Esqueleto base del proyecto. **Programación 4 · UTN FRVM.**
Cubre el setup de los Días 1–2: estructura, entidades, configuración y manejo de errores. Cada dev agrega su repository/service/controller en su rama desde el Día 3. **Identificadores en español.**

## Requisitos
- JDK 17+
- PostgreSQL 15+
- Maven (o el wrapper que genere el IDE)

## Puesta en marcha (Días 1–2)
1. **Crear la base de datos:** ejecutar `docs/ddl.sql` en pgAdmin o psql. Crea `prode_db` con todas las tablas (incluido grupos de RF8).
2. **Configurar `src/main/resources/application.properties`:** ajustar usuario/contraseña de PostgreSQL si difieren de `postgres/postgres`.
3. **Cambiar la clave JWT:** `jwt.secret` trae un placeholder generado. Cambiarlo y no subir la clave real al repo.
4. **Levantar la app:** `mvn spring-boot:run` (o F5 en VS Code). Como `ddl-auto=validate`, Hibernate verifica las entidades contra las tablas; si arranca sin error, el mapeo está OK.

## Qué ya viene resuelto
- **Entidades (7):** `Usuario`, `Equipo`, `Fecha`, `Partido`, `Pronostico`, `Grupo`, `MiembroGrupo`.
- **Enums:** `Rol` (USER/ADMIN), `EstadoPartido` (POR_JUGARSE/EN_JUEGO/FINALIZADO), `EstadoFecha` (PROGRAMADA/EN_JUEGO/FINALIZADA).
- **Manejo de errores global:** `GlobalExceptionHandler` con formato `{ "error": "mensaje" }` y excepciones `RecursoNoEncontradoException` (404), `ConflictoException` (409), `AccesoDenegadoException` (403), `SolicitudInvalidaException` (400) + validación `@Valid` (400).
- **`ApiResponse`** genérico `{ exito, mensaje, datos }`.
- **Integridad temporal (RNF2):** Hibernate y Jackson configurados en UTC.

## Estructura de paquetes
```
com.prode
├── entity        (listo: 7 entidades + 3 enums)
├── dto/response  (listo: ApiResponse)
├── dto/request   (cada dev agrega sus requests)
├── exception     (listo: handler + excepciones)
├── repository    (cada dev agrega sus repos)
├── service       (cada dev agrega su lógica)
├── controller    (cada dev agrega sus endpoints)
├── security      (Dev de Auth: JwtUtil, filtros, SecurityConfig)
└── config        (config adicional)
```

## Nomenclatura (español)
| Concepto | Tabla | Entidad |
|---|---|---|
| Usuarios | `usuarios` | `Usuario` |
| Equipos | `equipos` | `Equipo` |
| Fechas / Jornadas | `fechas` | `Fecha` |
| Partidos | `partidos` | `Partido` |
| Pronósticos | `pronosticos` | `Pronostico` |
| Grupos privados | `grupos` | `Grupo` |
| Miembros de grupo | `miembros_grupo` | `MiembroGrupo` |

## Reparto y detalle
- Quién hace qué y el cronograma: **01_Plan_Trabajo_Prode**.
- Decisiones, HU, mapa de la API y código de RF8: **02_Especificacion_Tecnica_Prode**.
- Diagrama de base de datos: **DER_Prode** (PNG/PDF) y `docs/ddl.sql`.

## Git
Nunca pushear directo a `main` ni a `develop`. Cada una trabaja en su rama `feature/xxx` y hace pull request a `develop`.
