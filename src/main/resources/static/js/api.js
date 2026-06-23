/* ══════════════════════════════════════════════════════════════════════
   api.js — La capa que habla con el backend.
   Acá está TODA la comunicación con la API. Ninguna otra parte del
   frontend usa fetch directamente: siempre pasan por acá.
   Esto te conviene para la defensa: "toda la comunicación está en un
   solo archivo, centralizada".
   ════════════════════════════════════════════════════════════════════════ */

/* ─────────── Configuración ───────────
   El frontend se sirve desde el mismo backend (resources/static), así que la
   API está en el mismo origen. Con base relativa ("") los pedidos van a
   /api/... del mismo host:puerto. No hay CORS y funciona en cualquier host
   (localhost, Render, etc.) sin tocar nada.
   Si algún día servís el frontend aparte (Live Server), poné acá la URL
   del backend, ej: "http://localhost:8080", y activá CORS en el backend. */
const API_BASE = "";

/* Clave con la que guardamos la sesión en el navegador.
   Usamos localStorage para que la sesión sobreviva al recargar la página
   (más cómodo para probar). */
const CLAVE_SESION = "prode_sesion";


/* ══════════════════════════════════════════════════════════════════════
   1. ERROR DE API
   Un error "a medida" que lleva el código HTTP (404, 403, etc.) y el
   mensaje que mandó el backend. Las vistas lo atrapan y deciden qué hacer.
   ════════════════════════════════════════════════════════════════════════ */
class ApiError extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;   // número HTTP: 400, 401, 403, 404, 409, 500, o 0 si no conectó
    this.name = "ApiError";
  }
}


/* ══════════════════════════════════════════════════════════════════════
   2. MANEJO DE LA SESIÓN (token + datos del usuario)
   Tras el login guardamos { token, nombreUsuario, rol }.
   ════════════════════════════════════════════════════════════════════════ */
function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}
function obtenerSesion() {
  const crudo = localStorage.getItem(CLAVE_SESION);
  return crudo ? JSON.parse(crudo) : null;
}
function obtenerToken() {
  const sesion = obtenerSesion();
  return sesion ? sesion.token : null;
}
function haySesion() {
  return obtenerToken() !== null;
}
function esAdmin() {
  const sesion = obtenerSesion();
  return sesion ? sesion.rol === "ADMIN" : false;
}
function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}


/* ══════════════════════════════════════════════════════════════════════
   3. EL "DESEMPAQUETADOR"
   El backend NO es uniforme:
     - Algunos endpoints devuelven { exito, mensaje, datos: ... }
       (Auth y Pronósticos).
     - Otros devuelven el objeto/array pelado
       (Equipos, Fechas, Partidos, Leaderboard, Grupos).
   Esta función detecta el caso del sobre y te devuelve siempre lo útil.
   ════════════════════════════════════════════════════════════════════════ */
function desempaquetar(json) {
  const esSobre =
    json &&
    typeof json === "object" &&
    !Array.isArray(json) &&
    "exito" in json &&
    "datos" in json;
  return esSobre ? json.datos : json;
}


/* ══════════════════════════════════════════════════════════════════════
   4. EL MOTOR: una sola función que hace TODOS los pedidos HTTP.
   Se encarga de:
     - poner la URL completa
     - poner el header Authorization: Bearer <token> si hay sesión
     - mandar el body como JSON
     - parsear la respuesta y desempaquetarla
     - tirar un ApiError si algo salió mal
   ════════════════════════════════════════════════════════════════════════ */
async function pedir(metodo, ruta, cuerpo) {
  const opciones = {
    method: metodo,
    headers: {},
  };

  // Si estamos logueados, mandamos el token en cada pedido.
  const token = obtenerToken();
  if (token) {
    opciones.headers["Authorization"] = "Bearer " + token;
  }

  // Si hay body, lo mandamos como JSON.
  if (cuerpo !== undefined && cuerpo !== null) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }

  // 1) Hacemos la llamada. Si el backend está apagado, fetch falla acá.
  let respuesta;
  try {
    respuesta = await fetch(API_BASE + ruta, opciones);
  } catch (e) {
    throw new ApiError(0, "No me pude conectar con el servidor. ¿Está corriendo el backend en " + API_BASE + "?");
  }

  // 2) 204 = "sin contenido" (típico de DELETE). No hay JSON que leer.
  if (respuesta.status === 204) return null;

  // 3) Leemos el cuerpo como texto y, si tiene algo, lo parseamos a JSON.
  const texto = await respuesta.text();
  let json = null;
  if (texto) {
    try { json = JSON.parse(texto); } catch (e) { json = null; }
  }

  // 4) Si el código HTTP es de error, armamos el ApiError.
  if (!respuesta.ok) {
    // El backend manda los errores como { "error": "mensaje" }
    let mensaje = (json && json.error) ? json.error : ("Error " + respuesta.status);

    // Si el token venció (401) y no es la pantalla de login: cerramos sesión,
    // actualizamos la barra y mandamos al login con un mensaje claro.
    if (respuesta.status === 401 && !ruta.startsWith("/api/auth")) {
      cerrarSesion();
      if (window.refrescarChrome) window.refrescarChrome();
      location.hash = "#/login";
      mensaje = "Tu sesión expiró. Volvé a ingresar.";
    }
    throw new ApiError(respuesta.status, mensaje);
  }

  // 5) Todo bien: desempaquetamos y devolvemos.
  return desempaquetar(json);
}


/* ══════════════════════════════════════════════════════════════════════
   5. LOS ENDPOINTS
   Cada función de acá se corresponde con una ruta del backend.
   Las agrupé por módulo. Las rutas y nombres de campos están verificados
   contra el código real del backend.
   ════════════════════════════════════════════════════════════════════════ */
const API = {

  /* ---- estado de sesión (re-exportado para usar desde las vistas) ---- */
  haySesion,
  obtenerSesion,
  esAdmin,
  cerrarSesion,

  /* ---- AUTH (público) ---- */

  // POST /api/auth/registro  body: { nombreUsuario, email, password }
  registrar(nombreUsuario, email, password) {
    return pedir("POST", "/api/auth/registro", { nombreUsuario, email, password });
  },

  // POST /api/auth/login  body: { email, password }
  // Devuelve { token, nombreUsuario, rol } y lo guardamos en el navegador.
  async login(email, password) {
    const datos = await pedir("POST", "/api/auth/login", { email, password });
    guardarSesion({
      token: datos.token,
      nombreUsuario: datos.nombreUsuario,
      rol: datos.rol,
    });
    return datos;
  },

  /* ---- EQUIPOS (lectura: cualquiera con sesión; alta/baja: ADMIN) ---- */

  listarEquipos() {
    return pedir("GET", "/api/equipos");           // -> [ { id, nombre } ]
  },
  crearEquipo(nombre) {
    return pedir("POST", "/api/equipos", { nombre });
  },
  eliminarEquipo(id) {
    return pedir("DELETE", "/api/equipos/" + id);
  },

  /* ---- FECHAS / JORNADAS (lectura: con sesión; alta/baja: ADMIN) ---- */

  listarFechas() {
    return pedir("GET", "/api/fechas");            // -> [ { id, nombre, estado } ]
  },
  crearFecha(nombre) {
    return pedir("POST", "/api/fechas", { nombre });
  },
  eliminarFecha(id) {
    return pedir("DELETE", "/api/fechas/" + id);
  },

  /* ---- PARTIDOS (lectura: con sesión; gestión: ADMIN) ---- */

  // -> [ { id, fechaId, fechaNombre, equipoLocalId, equipoLocalNombre,
  //        equipoVisitanteId, equipoVisitanteNombre, horaInicio, estado,
  //        golesLocal, golesVisitante, ganador } ]   (ordenados por hora)
  listarPartidos() {
    return pedir("GET", "/api/partidos");
  },
  // body: { fechaId, equipoLocalId, equipoVisitanteId, horaInicio (ISO) }
  crearPartido(datos) {
    return pedir("POST", "/api/partidos", datos);
  },
  // PATCH /api/partidos/{id}/start  -> pasa el partido a EN_JUEGO
  iniciarPartido(id) {
    return pedir("PATCH", "/api/partidos/" + id + "/start");
  },
  // PATCH /api/partidos/{id}/resultado  body: { golesLocal, golesVisitante }
  cargarResultado(id, golesLocal, golesVisitante) {
    return pedir("PATCH", "/api/partidos/" + id + "/resultado", { golesLocal, golesVisitante });
  },
  eliminarPartido(id) {
    return pedir("DELETE", "/api/partidos/" + id);
  },

  /* ---- PRONÓSTICOS (rol USER) ---- */

  // PUT /api/pronosticos/{partidoId}  body: { golesLocal, golesVisitante }
  // Crea o modifica (upsert). Devuelve el pronóstico guardado.
  guardarPronostico(partidoId, golesLocal, golesVisitante) {
    return pedir("PUT", "/api/pronosticos/" + partidoId, { golesLocal, golesVisitante });
  },
  // GET /api/pronosticos/mios -> [ { id, partidoId, golesLocal, golesVisitante, puntosObtenidos } ]
  misPronosticos() {
    return pedir("GET", "/api/pronosticos/mios");
  },
  // GET /api/pronosticos/partido/{partidoId}
  // Devuelve los de OTROS usuarios. 403 si todavía no expiró el bloqueo de 30 min.
  pronosticosDePartido(partidoId) {
    return pedir("GET", "/api/pronosticos/partido/" + partidoId);
  },

  /* ---- LEADERBOARD (con sesión) ---- */

  // GET /api/leaderboard
  // -> [ { usuarioId, nombreUsuario, puntosTotales, exactos, creadoEn, posicion } ]
  obtenerLeaderboard() {
    return pedir("GET", "/api/leaderboard");
  },

  /* ---- GRUPOS / RF8 (con sesión) ---- */

  // POST /api/grupos  body: { nombre }
  // -> { id, nombre, codigoInvitacion, propietarioNombreUsuario, creadoEn }
  crearGrupo(nombre) {
    return pedir("POST", "/api/grupos", { nombre });
  },
  // POST /api/grupos/unirse  body: { codigoInvitacion }
  unirseAGrupo(codigoInvitacion) {
    return pedir("POST", "/api/grupos/unirse", { codigoInvitacion });
  },
  // GET /api/grupos/mis-grupos -> [ { id, nombre, codigoInvitacion, ... } ]
  misGrupos() {
    return pedir("GET", "/api/grupos/mis-grupos");
  },
  // GET /api/grupos/{id}/ranking -> mismo formato que el leaderboard global
  rankingDeGrupo(grupoId) {
    return pedir("GET", "/api/grupos/" + grupoId + "/ranking");
  },
};

// Dejamos ApiError accesible globalmente por si una vista quiere chequear el código.
window.ApiError = ApiError;
window.API = API;
