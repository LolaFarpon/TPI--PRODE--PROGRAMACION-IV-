# Prode — Plataforma de Pronósticos Deportivos

Trabajo Práctico Integrador · Programación IV · UTN FRVM

Backend de una plataforma de "Prode" (pronósticos deportivos de fútbol): permite a los usuarios predecir resultados de partidos, calcula puntos automáticamente al cargarse los resultados reales, y mantiene tablas de posiciones globales y por grupos privados. Incluye además un frontend web (SPA) que consume la API.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Modelo de datos](#modelo-de-datos)
4. [Seguridad](#seguridad)
5. [Reglas de negocio críticas](#reglas-de-negocio-críticas)
6. [API REST — Endpoints](#api-rest--endpoints)
7. [Frontend](#frontend)
8. [Cómo correr el proyecto](#cómo-correr-el-proyecto)
9. [Estructura del repositorio](#estructura-del-repositorio)

---

## Stack tecnológico

| Componente | Tecnología |
|------------|-----------|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.3.0 |
| Persistencia | Spring Data JPA / Hibernate |
| Base de datos | PostgreSQL |
| Seguridad | Spring Security + JWT (jjwt 0.12.3) |
| Hash de contraseñas | BCrypt |
| Validación | Jakarta Bean Validation |
| Frontend | HTML5 + CSS3 + JavaScript vanilla (SPA) |
| Build | Maven |

El proyecto es un único deployable monolítico: el frontend se sirve como contenido estático desde el propio Spring Boot, por lo que backend y frontend conviven en el mismo origen (`localhost:8080`).

---

## Arquitectura

El backend sigue una **arquitectura en capas** que separa responsabilidades:

```
Cliente (Frontend SPA / Postman)
        │  HTTP + JWT
        ▼
   CONTROLLER   → recibe la petición, valida formato, responde con código HTTP
        │
        ▼
    SERVICE     → lógica de negocio (reglas, validaciones, cálculos)
        │
        ▼
   REPOSITORY   → acceso a datos (Spring Data JPA)
        │
        ▼
    ENTITY      → mapeo objeto-relacional de las tablas
```

**Decisiones de diseño:**

- **Separación en capas:** cada capa tiene una única responsabilidad, lo que facilita el mantenimiento y las pruebas. La lógica de negocio vive en los *services*, nunca en los *controllers*.
- **DTOs de entrada y salida:** las entidades nunca se exponen directamente en la API. Los `*Request` validan los datos entrantes (con anotaciones como `@NotBlank`, `@Size`, `@Min`) y los `*Response` controlan qué información se devuelve (por ejemplo, nunca se expone el hash de la contraseña).
- **Manejo de excepciones centralizado:** un `@RestControllerAdvice` global traduce las excepciones de negocio a códigos HTTP coherentes, evitando repetir manejo de errores en cada controller.
- **Inyección de dependencias por constructor:** desacopla las clases y favorece la testeabilidad.
- **Idioma español:** todo el dominio (entidades, tablas, endpoints, enumerados) está en español por requisito de la cátedra.

**Capas del proyecto:**

- `controller/` — controllers REST (uno por recurso: Auth, Equipo, Fecha, Partido, Pronostico, Leaderboard, Grupo).
- `service/` — lógica de negocio.
- `repository/` — interfaces Spring Data JPA.
- `entity/` — entidades JPA y enumerados.
- `dto/request/` y `dto/response/` — objetos de transferencia de datos.
- `security/` — JWT y filtros de autenticación.
- `config/` — configuración de Spring Security.
- `exception/` — excepciones de negocio y handler global.

---

## Modelo de datos

El sistema se compone de siete entidades principales:

| Entidad | Descripción | Campos clave |
|---------|-------------|--------------|
| **Usuario** | Cuenta del sistema | `nombreUsuario` (único), `email` (único), `contrasenaHash`, `rol`, `creadoEn` |
| **Equipo** | Equipo de fútbol | `nombre` |
| **Fecha** | Jornada que agrupa partidos | `nombre` (único), `estado` (calculado dinámicamente) |
| **Partido** | Encuentro entre dos equipos | `fecha`, `equipoLocal`, `equipoVisitante`, `horaInicio`, `estado`, `golesLocal`, `golesVisitante`, `ganador` |
| **Pronostico** | Predicción de un usuario | `usuario`, `partido`, `golesLocalPron`, `golesVisitantePron`, `puntosObtenidos` — restricción única `(usuario, partido)` |
| **Grupo** | Grupo privado de amigos | `nombre`, `codigoInvitacion` (único), `propietario` |
| **MiembroGrupo** | Relación usuario↔grupo | `grupo`, `usuario` (tabla intermedia muchos-a-muchos) |

**Enumerados:**

- `Rol`: `USER`, `ADMIN`.
- `EstadoPartido`: `POR_JUGARSE`, `EN_JUEGO`, `FINALIZADO`.
- `EstadoFecha`: `PROGRAMADA`, `EN_JUEGO`, `FINALIZADA` (calculado en base a los partidos que contiene).

El detalle del modelo (tablas, tipos, relaciones y restricciones) está en el **diagrama entidad-relación** (`docs/`) y en el script DDL (`docs/ddl.sql`).

---

## Seguridad

**Autenticación con JWT (RF1.2).** El login valida las credenciales y devuelve un token JWT firmado. El token lleva como *subject* el email del usuario y un *claim* con su rol. En cada petición a un endpoint protegido, el cliente envía el token en el header `Authorization: Bearer <token>`. Un filtro (`JwtAuthFilter`) lo intercepta, valida la firma y la expiración, y establece la identidad del usuario. El esquema es **stateless**: el servidor no guarda sesión.

**Hash de contraseñas con BCrypt (RNF1).** Las contraseñas nunca se almacenan en texto plano. Se guardan hasheadas con BCrypt, que aplica un *salt* único automáticamente: dos contraseñas iguales producen hashes distintos. En el login, Spring Security compara el texto ingresado contra el hash almacenado.

**Autorización por roles (RF1.3).** Se distinguen dos roles:
- `USER` (por defecto): gestiona sus pronósticos, participa en rankings, crea y se une a grupos.
- `ADMIN`: gestiona equipos, fechas, partidos y carga resultados.

La restricción se aplica a nivel de método con `@PreAuthorize("hasRole('ADMIN')")` / `hasRole('USER')`, habilitado por `@EnableMethodSecurity`. Un endpoint de gestión rechaza a un `USER` con **403 Forbidden**; un endpoint de juego rechaza a un `ADMIN`.

**Rutas públicas vs protegidas.** Son públicos los archivos del frontend (`/`, `/index.html`, `/css/**`, `/js/**`, `/images/**`) y el registro/login (`/api/auth/**`). Todo el resto de la API requiere un token válido.

---

## Reglas de negocio críticas

El backend es el único responsable de garantizar la integridad y la transparencia del juego. Las reglas se programan de forma estricta, sin confiar en datos enviados por el cliente.

**1. Margen de bloqueo de pronósticos (30 minutos).** Un usuario solo puede crear o modificar un pronóstico hasta 30 minutos antes de la hora de inicio del partido. La hora límite es `horaInicio − 30 min`. Toda petición posterior se rechaza usando la **hora del servidor en UTC**, nunca un parámetro del cliente.

**2. Integridad temporal (RNF2).** Todas las fechas se almacenan y comparan en **UTC**, configurado tanto en Hibernate (`hibernate.jdbc.time_zone=UTC`) como en la serialización JSON (`spring.jackson.time-zone=UTC`). Esto evita inconsistencias por zonas horarias.

**3. Transición de estados del partido.** Un partido pasa por `POR_JUGARSE` → `EN_JUEGO` → `FINALIZADO`. Solo el ADMIN cambia el estado. El resultado real solo puede cargarse si el partido está `EN_JUEGO`; al cargarlo, pasa automáticamente a `FINALIZADO` y se dispara el motor de puntuación.

**4. Unicidad de pronósticos (RF5.1).** Un usuario tiene un único pronóstico por partido, garantizado por una restricción única compuesta `(usuario_id, partido_id)`. Si el pronóstico ya existe, la operación se interpreta como modificación (*upsert*); por eso el endpoint usa **PUT**.

**5. Privacidad de pronósticos de terceros (RF5.3).** Un usuario no puede ver los pronósticos de otros para un partido hasta que se haya cumplido el margen de bloqueo de ese partido. Antes del cierre, la consulta se rechaza.

**6. Motor de puntuación (RF6.3).** Al finalizar un partido, se calculan los puntos de cada pronóstico:
- **3 puntos** — resultado exacto (acertó los goles de ambos equipos).
- **1 punto** — acertó la tendencia (quién ganó o empate) pero no el marcador.
- **0 puntos** — no acertó ni la tendencia.

La tendencia se obtiene comparando los goles (`Integer.compare`): gana local, empate o gana visitante. El cálculo de todos los pronósticos de un partido se ejecuta dentro de una transacción (`@Transactional`): se actualizan todos o ninguno.

**7. Tablas de posiciones (RF7).** El ranking ordena a los usuarios por puntos totales (de mayor a menor). Criterios de desempate, en orden: (1) mayor cantidad de resultados exactos, (2) antigüedad del usuario (el más antiguo primero). La consulta usa `LEFT JOIN` para incluir también a usuarios sin pronósticos (con 0 puntos), y `COALESCE` para convertir sumas nulas en cero.

**8. Grupos privados (RF8).** Al crear un grupo se genera un código de invitación alfanumérico único e irrepetible (con `SecureRandom`, regenerándolo si ya existe). El creador queda automáticamente como miembro. Otros usuarios se unen ingresando el código. El ranking del grupo aplica las mismas reglas que el global, filtrado a los miembros.

---

## API REST — Endpoints

Todos los endpoints, salvo registro y login, requieren el header `Authorization: Bearer <token>`. La colección completa de Postman está en `docs/`.

### Autenticación (`/api/auth`) — público
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registrar un usuario (nace como USER) |
| POST | `/api/auth/login` | Iniciar sesión, devuelve el JWT |

### Equipos (`/api/equipos`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/equipos` | ADMIN | Crear equipo |
| GET | `/api/equipos` | autenticado | Listar equipos |
| DELETE | `/api/equipos/{id}` | ADMIN | Eliminar (si no tiene partidos) |

### Fechas (`/api/fechas`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/fechas` | ADMIN | Crear fecha (jornada) |
| GET | `/api/fechas` | autenticado | Listar fechas (filtrable por estado) |
| PUT | `/api/fechas/{id}` | ADMIN | Modificar nombre (si está PROGRAMADA) |
| DELETE | `/api/fechas/{id}` | ADMIN | Eliminar (si está PROGRAMADA y sin partidos) |

### Partidos (`/api/partidos`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/partidos` | ADMIN | Crear partido (nace POR_JUGARSE) |
| GET | `/api/partidos` | autenticado | Listar (filtrable por fecha, orden cronológico) |
| PUT | `/api/partidos/{id}` | ADMIN | Reprogramar (si está POR_JUGARSE) |
| PATCH | `/api/partidos/{id}/start` | ADMIN | Pasar a EN_JUEGO |
| PATCH | `/api/partidos/{id}/resultado` | ADMIN | Cargar resultado → FINALIZADO + dispara el motor |
| DELETE | `/api/partidos/{id}` | ADMIN | Eliminar (POR_JUGARSE y sin pronósticos) |

### Pronósticos (`/api/pronosticos`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| PUT | `/api/pronosticos/{partidoId}` | USER | Crear o modificar pronóstico (upsert) |
| GET | `/api/pronosticos/mios` | USER | Listar mis pronósticos |
| GET | `/api/pronosticos/partido/{partidoId}` | USER | Pronósticos de terceros (tras el bloqueo) |

### Leaderboard (`/api/leaderboard`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/leaderboard` | autenticado | Ranking global |

### Grupos (`/api/grupos`)
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/grupos` | USER | Crear grupo (genera código) |
| POST | `/api/grupos/unirse` | USER | Unirse con código de invitación |
| GET | `/api/grupos/mis-grupos` | USER | Listar mis grupos |
| GET | `/api/grupos/{id}/ranking` | autenticado | Ranking del grupo |

**Formato de respuesta.** Los módulos de Auth y Pronósticos envuelven la respuesta en un objeto `{ exito, mensaje, datos }`. Los demás devuelven el recurso directamente. Los errores se devuelven como `{ error: "mensaje" }` con el código HTTP correspondiente.

**Códigos HTTP usados:** 200 (OK), 201 (creado), 400 (solicitud inválida / regla de negocio), 401 (no autenticado), 403 (sin permiso), 404 (no encontrado), 409 (conflicto / duplicado), 500 (error interno).

---

## Frontend

Interfaz web de tipo **SPA (Single Page Application)** en HTML/CSS/JavaScript vanilla, sin frameworks. Se sirve desde el propio Spring Boot (carpeta `src/main/resources/static/`), por lo que comparte origen con la API y no requiere configuración de CORS.

**Organización:**
- `index.html` — contenedor único de la aplicación.
- `css/estilos.css` — estilos propios (diseño temático).
- `js/api.js` — capa única de comunicación con el backend; centraliza el `fetch` y el manejo del token (guardado en `localStorage`).
- `js/router.js` — router por `hashchange` que cambia de vista sin recargar.
- `js/app.js` — orquestación general.
- `js/vista-*.js` — una vista por sección: autenticación, panel de administración, partidos, leaderboard y grupos.

**Seguridad en el frontend:** la guarda de rutas (redirigir al login si no hay sesión) es una comodidad de la interfaz, no un mecanismo de seguridad. La seguridad real reside en el backend (JWT + `@PreAuthorize`). Los datos provenientes de la base se escapan antes de insertarse en el DOM para prevenir inyección de HTML.

El frontend es un complemento opcional según la consigna; el backend cumple por sí solo todos los requerimientos.

---

## Cómo correr el proyecto

### Requisitos previos
- Java 21 (JDK)
- Maven
- PostgreSQL en ejecución

### 1. Base de datos
Crear la base de datos `prode_db` en PostgreSQL y ejecutar el script de estructura:
```bash
psql -U postgres -d prode_db -f docs/ddl.sql
```
Opcionalmente, cargar datos de prueba:
```bash
psql -U postgres -d prode_db -f docs/test_data.sql
```

### 2. Configuración
En `src/main/resources/application.properties`, ajustar las credenciales locales de PostgreSQL y la clave JWT:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/prode_db
spring.datasource.username=postgres
spring.datasource.password=TU_CLAVE_LOCAL
jwt.secret=UNA_CLAVE_SECRETA_EN_BASE64
jwt.expiration=86400000
```
> La clave de base de datos y el secreto JWT son locales de cada entorno y **no deben subirse al repositorio**.

### 3. Ejecutar
Desde la raíz del proyecto:
```bash
./mvnw spring-boot:run
```
o desde el IDE, ejecutando la clase `ProdeApplication`.

### 4. Acceder
- **Aplicación web:** abrir el navegador en `http://localhost:8080`.
- **API:** disponible en `http://localhost:8080/api/...` (ver la colección de Postman en `docs/`).

> Importante: el frontend debe abrirse mediante `http://localhost:8080` (servido por Spring Boot), no abriendo el archivo HTML directamente desde el IDE, ya que en ese caso no encontraría el backend.

### Crear un usuario administrador
El registro siempre crea usuarios con rol `USER`. Para obtener un ADMIN, se cambia el rol en la base y se vuelve a iniciar sesión (para que el nuevo token incluya el rol actualizado):
```sql
UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'admin@ejemplo.com';
```

---

## Estructura del repositorio

```
TPI--PRODE--PROGRAMACION-IV-/
├── docs/                          # Documentación de respaldo
│   ├── ddl.sql                    # Script de creación de tablas
│   ├── test_data.sql              # Datos de prueba
│   └── prode.postman_collection.json   # Colección de Postman
├── src/
│   └── main/
│       ├── java/com/prode/
│       │   ├── config/            # Spring Security
│       │   ├── controller/        # Controllers REST
│       │   ├── dto/               # Request / Response
│       │   ├── entity/            # Entidades JPA y enums
│       │   ├── exception/         # Excepciones + handler global
│       │   ├── repository/        # Spring Data JPA
│       │   ├── security/          # JWT y filtros
│       │   ├── service/           # Lógica de negocio
│       │   └── ProdeApplication.java
│       └── resources/
│           ├── static/            # Frontend (SPA)
│           └── application.properties
└── pom.xml
```

---

*Trabajo Práctico Integrador — Programación IV — Tecnicatura Universitaria en Programación — UTN Facultad Regional Villa María.*
