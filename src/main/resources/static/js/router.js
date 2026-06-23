/* ══════════════════════════════════════════════════════════════════════
   router.js — El router de la SPA (una sola página).
   No recargamos la página: cambiamos lo que se muestra según el "hash"
   de la URL (la parte después del #). Ej: #/partidos, #/grupos.
   Ventaja para la defensa: es una SPA de verdad, sin recargar el navegador.
   ════════════════════════════════════════════════════════════════════════ */

const Router = {

  // Acá guardamos las rutas registradas: { patron: funcionQueRenderiza }
  rutas: [],

  // Rutas que requieren estar logueado. Si no hay sesión, mandamos al login.
  // A partir de la Etapa 2 la guarda se enciende desde app.js (guardaActiva = true).
  protegidas: ["/partidos", "/mis-pronosticos", "/leaderboard", "/grupos", "/admin"],

  guardaActiva: false,   // app.js lo pone en true al iniciar (ya hay login)

  /* Registrar una ruta.
     patron puede tener parámetros con ":" — ej "/grupos/:id/ranking" */
  registrar(patron, render) {
    this.rutas.push({ patron, render });
  },

  /* Lee la ruta actual desde la URL (sin el #). Si no hay nada, "/". */
  rutaActual() {
    return location.hash.replace(/^#/, "") || "/";
  },

  /* Navegar a otra ruta (cambia el hash; eso dispara el render). */
  ir(ruta) {
    location.hash = ruta;
  },

  /* Intenta hacer "calzar" la URL actual contra un patrón registrado.
     Devuelve los parámetros encontrados, o null si no calza.
     Ej: patrón "/grupos/:id/ranking" + url "/grupos/5/ranking" -> { id: "5" } */
  calzar(patron, url) {
    const partesPatron = patron.split("/").filter(Boolean);
    const partesUrl = url.split("/").filter(Boolean);
    if (partesPatron.length !== partesUrl.length) return null;

    const params = {};
    for (let i = 0; i < partesPatron.length; i++) {
      const p = partesPatron[i];
      if (p.startsWith(":")) {
        params[p.slice(1)] = decodeURIComponent(partesUrl[i]);  // es un parámetro
      } else if (p !== partesUrl[i]) {
        return null;  // un segmento fijo no coincide
      }
    }
    return params;
  },

  /* ¿Esta ruta necesita login? */
  esProtegida(url) {
    return this.protegidas.some(base => url === base || url.startsWith(base + "/"));
  },

  /* El corazón: decide qué vista mostrar y la dibuja en #vista. */
  async resolver() {
    const url = this.rutaActual();
    const contenedor = document.getElementById("vista");

    // Guarda de seguridad (cuando esté activa): sin sesión -> al login.
    if (this.guardaActiva && this.esProtegida(url) && !API.haySesion()) {
      this.ir("/login");
      return;
    }

    // Buscamos la primera ruta que calce.
    for (const { patron, render } of this.rutas) {
      const params = this.calzar(patron, url);
      if (params) {
        // Avisamos a app.js para que marque la pestaña activa en la nav.
        document.dispatchEvent(new CustomEvent("ruta-cambiada", { detail: { url } }));
        await render(contenedor, params);
        window.scrollTo(0, 0);
        return;
      }
    }

    // Ninguna ruta calzó -> 404.
    contenedor.innerHTML = `
      <div class="vacio">
        <div class="icono">🧭</div>
        <h3>Página no encontrada</h3>
        <p>La ruta <code>${url}</code> no existe.</p>
      </div>`;
  },

  /* Arranca el router: escucha cambios de hash y resuelve la ruta inicial. */
  iniciar() {
    window.addEventListener("hashchange", () => this.resolver());
    this.resolver();
  },
};

window.Router = Router;
