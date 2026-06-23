/* ══════════════════════════════════════════════════════════════════════
   app.js — El arranque de la aplicación.
   Junta todo: dibuja la navegación, el chip de sesión, los avisos,
   registra las vistas en el router y lo enciende.
   ════════════════════════════════════════════════════════════════════════ */

/* ─────────── Avisos flotantes (toasts) ───────────
   Lo usamos en todas las etapas para feedback: "Pronóstico guardado", etc.
   tipo: "ok" | "error" | "info" */
function aviso(mensaje, tipo = "info") {
  const cont = document.getElementById("avisos");
  const el = document.createElement("div");
  el.className = "aviso " + tipo;
  el.textContent = mensaje;
  cont.appendChild(el);
  // Se va solo a los 3.5 segundos.
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

/* ─────────── Helpers compartidos de presentación ───────────
   Los usan varias vistas (partidos, leaderboard, grupos). */

/* Escapa texto antes de meterlo con innerHTML.
   Importante: nombres de usuario/equipo vienen de la base; si alguno
   tuviera un "<" rompería el HTML. Esto también evita inyección. */
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* La hora del backend viene en UTC (ISO). new Date la interpreta bien y
   la mostramos en la hora local del navegador (Argentina). */
function formatearFechaHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

/* Devuelve el HTML del chip de estado (POR_JUGARSE / EN_JUEGO / FINALIZADO). */
function chipEstado(estado) {
  const clase = (estado || "").toLowerCase();
  const textos = { por_jugarse: "Por jugarse", en_juego: "En juego", finalizado: "Finalizado" };
  return `<span class="estado ${clase}">${textos[clase] || esc(estado)}</span>`;
}

window.esc = esc;
window.formatearFechaHora = formatearFechaHora;
window.chipEstado = chipEstado;


/* ─────────── Pestañas de navegación ───────────
   Cambian según haya sesión y según el rol (USER ve pronósticos/grupos,
   ADMIN ve gestión). En la Etapa 1 mostramos la versión "sin sesión". */
function pestanas() {
  const sesion = API.obtenerSesion();

  // Sin sesión: solo Inicio e Ingresar.
  if (!sesion) {
    return [
      { ruta: "/", texto: "Inicio" },
      { ruta: "/login", texto: "Ingresar" },
    ];
  }

  // Con sesión: pestañas comunes.
  const tabs = [
    { ruta: "/", texto: "Inicio" },
    { ruta: "/partidos", texto: "Partidos" },
    { ruta: "/leaderboard", texto: "Tabla" },
  ];

  // USER también juega: pronósticos y grupos.
  if (sesion.rol === "USER") {
    tabs.push({ ruta: "/mis-pronosticos", texto: "Mis pronósticos" });
    tabs.push({ ruta: "/grupos", texto: "Grupos" });
  }
  // ADMIN gestiona.
  if (sesion.rol === "ADMIN") {
    tabs.push({ ruta: "/admin", texto: "Gestión" });
  }
  return tabs;
}

/* Dibuja la nav y resalta la pestaña activa. */
function dibujarNav(urlActiva) {
  const nav = document.getElementById("nav");
  const url = urlActiva || Router.rutaActual();
  nav.innerHTML = pestanas()
    .map(t => {
      const activa = (t.ruta === url) ? " activo" : "";
      return `<a href="#${t.ruta}" class="${activa.trim()}">${t.texto}</a>`;
    })
    .join("");
}

/* Dibuja el chip de sesión (usuario logueado) o el botón "Ingresar". */
function dibujarSesion() {
  const cont = document.getElementById("sesion");
  const sesion = API.obtenerSesion();

  if (!sesion) {
    cont.innerHTML = `<a href="#/login" class="boton boton-primario">Ingresar</a>`;
    return;
  }

  const inicial = sesion.nombreUsuario.charAt(0).toUpperCase();
  cont.innerHTML = `
    <div class="chip-usuario">
      <span class="avatar">${inicial}</span>
      <span>
        ${sesion.nombreUsuario}
        <span class="rol">${sesion.rol}</span>
      </span>
    </div>
    <button class="boton boton-fantasma" id="btn-salir">Salir</button>`;

  document.getElementById("btn-salir").addEventListener("click", () => {
    API.cerrarSesion();
    refrescarChrome();
    Router.ir("/");
    aviso("Cerraste sesión", "info");
  });
}

/* Redibuja nav + sesión (el "chrome" alrededor de la vista). */
function refrescarChrome() {
  dibujarNav();
  dibujarSesion();
}


/* ══════════════════════════════════════════════════════════════════════
   LAS VISTAS
   Cada vista es una función que recibe el contenedor y dibuja su HTML.
   En la Etapa 1: "inicio" está terminada; el resto son placeholders
   prolijos que iremos completando en las próximas etapas.
   ════════════════════════════════════════════════════════════════════════ */
const Vistas = {

  /* Vista de inicio (hero). Cambia un poco si estás logueada o no. */
  inicio(cont) {
    const sesion = API.obtenerSesion();
    const saludo = sesion ? `Hola de nuevo, ${sesion.nombreUsuario}.` : "Tu peña, tus pronósticos.";
    const cta = sesion
      ? `<a href="#/partidos" class="boton boton-primario">Ver partidos</a>`
      : `<a href="#/login" class="boton boton-primario">Ingresá y jugá</a>`;

    cont.innerHTML = `
      <section class="hero">
        <p class="eyebrow">Pronósticos deportivos</p>
        <h1 class="titulo">Clavá el<br>resultado.</h1>
        <p class="subtitulo">
          ${saludo} Pronosticá los partidos, sumá puntos por cada acierto
          y peleá la punta de la tabla contra tus amigos.
        </p>
        <div class="acciones">
          ${cta}
          <a href="#/leaderboard" class="boton boton-fantasma">Ver la tabla</a>
        </div>
        <div class="hero-tags">
          <span class="hero-tag">3 pts · resultado exacto</span>
          <span class="hero-tag">1 pt · acertás el ganador</span>
          <span class="hero-tag">0 pts · no la pegaste</span>
        </div>
      </section>
    `;
  },

  /* Placeholder reutilizable para las vistas que faltan. */
  _enConstruccion(cont, titulo, etapa, detalle) {
    cont.innerHTML = `
      <p class="eyebrow">PRODE</p>
      <h1 class="titulo">${titulo}</h1>
      <div class="linea-cancha"></div>
      <div class="vacio">
        <div class="icono">🚧</div>
        <h3>En construcción</h3>
        <p>Esta vista la armamos en la <strong>Etapa ${etapa}</strong>.<br>${detalle || ""}</p>
      </div>`;
  },

  login(cont) {
    Vistas._enConstruccion(cont, "Ingresar", 2, "Login y registro, conectados al Auth del backend.");
  },
  partidos(cont) {
    Vistas._enConstruccion(cont, "Partidos", 3, "Listado de partidos y carga de pronósticos.");
  },
  misPronosticos(cont) {
    Vistas._enConstruccion(cont, "Mis pronósticos", 3, "Todos tus pronósticos y los puntos que sumaste.");
  },
  leaderboard(cont) {
    Vistas._enConstruccion(cont, "Tabla de posiciones", 4, "El ranking global con los criterios de desempate.");
  },
  grupos(cont) {
    Vistas._enConstruccion(cont, "Grupos", 5, "Crear grupo, unirse con código y ranking del grupo (RF8).");
  },
  admin(cont) {
    Vistas._enConstruccion(cont, "Gestión", 3, "Panel de ADMIN: equipos, fechas, partidos y resultados.");
  },
};


/* ══════════════════════════════════════════════════════════════════════
   REGISTRO DE RUTAS + ARRANQUE
   ════════════════════════════════════════════════════════════════════════ */
/* Registramos cada ruta con un "envoltorio" que busca la vista en el momento
   de dibujar. Así, si una etapa posterior reemplaza Vistas.login (como hace
   vista-auth.js), el router ya usa la versión nueva sin tener que re-registrar. */
Router.registrar("/", (c, p) => Vistas.inicio(c, p));
Router.registrar("/login", (c, p) => Vistas.login(c, p));
Router.registrar("/partidos", (c, p) => Vistas.partidos(c, p));
Router.registrar("/mis-pronosticos", (c, p) => Vistas.misPronosticos(c, p));
Router.registrar("/leaderboard", (c, p) => Vistas.leaderboard(c, p));
Router.registrar("/grupos", (c, p) => Vistas.grupos(c, p));
Router.registrar("/admin", (c, p) => Vistas.admin(c, p));

// Cuando el router cambia de ruta, actualizamos la pestaña activa de la nav.
document.addEventListener("ruta-cambiada", (e) => dibujarNav(e.detail.url));

// Al cargar la página: dibujamos el chrome y encendemos el router.
window.addEventListener("DOMContentLoaded", () => {
  Router.guardaActiva = true;   // Etapa 2: ya hay login, activamos la guarda
  refrescarChrome();
  Router.iniciar();
});

// Exponemos helpers que las próximas etapas van a usar.
window.aviso = aviso;
window.refrescarChrome = refrescarChrome;
