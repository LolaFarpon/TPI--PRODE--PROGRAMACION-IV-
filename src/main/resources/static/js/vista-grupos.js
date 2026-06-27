/* ══════════════════════════════════════════════════════════════════════
   vista-grupos.js — Etapa 5: Grupos privados (RF8).
   - Crear grupo (el backend genera un código de invitación único).
   - Unirse a un grupo con un código.
   - Listar mis grupos.
   - Ver el ranking de cada grupo (reutiliza tablaPosiciones de la Etapa 4).
   ════════════════════════════════════════════════════════════════════════ */

(function () {

  /* Copia un texto al portapapeles, con plan B si el navegador no deja. */
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      aviso("Código copiado", "ok");
    } catch (e) {
      // Plan B: textarea temporal.
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); aviso("Código copiado", "ok"); }
      catch (e2) { aviso("No pude copiar; copialo a mano: " + texto, "info"); }
      ta.remove();
    }
  }

  /* Tarjeta de un grupo. */
  function tarjetaGrupo(g) {
    return `<div class="tarjeta grupo-card">
      <div class="grupo-head">
        <div>
          <div class="grupo-nombre">${esc(g.nombre)}</div>
          <div class="grupo-dueno">Creado por ${esc(g.propietarioNombreUsuario)}</div>
        </div>
      </div>
      <div class="codigo-box">
        <span class="label">Código</span>
        <span class="codigo">${esc(g.codigoInvitacion)}</span>
        <button class="btn-copiar" data-codigo="${esc(g.codigoInvitacion)}">Copiar</button>
      </div>
      <button class="boton boton-fantasma btn-ranking" data-id="${g.id}" style="margin-top:14px">Ver ranking</button>
      <div class="ranking-zona" id="ranking-${g.id}"></div>
    </div>`;
  }

  /* Vista principal. */
  async function mostrarGrupos(cont) {
    cont.innerHTML = `<p class="eyebrow">Tu peña</p><h1 class="titulo">Grupos</h1>
      <div class="linea-cancha"></div><p class="cargando">Cargando tus grupos…</p>`;

    try {
      const grupos = await API.misGrupos();

      let html = `<p class="eyebrow">Tu peña</p><h1 class="titulo">Grupos</h1>
        <div class="linea-cancha"></div>

        <div class="grupos-acciones">
          <div class="tarjeta">
            <h3>Crear un grupo</h3>
            <div class="campo">
              <input id="nombre-grupo" placeholder="Nombre del grupo (ej: Los del laburo)" />
            </div>
            <button class="boton boton-primario" id="btn-crear-grupo" style="width:100%;justify-content:center">Crear grupo</button>
          </div>
          <div class="tarjeta">
            <h3>Unirse con un código</h3>
            <div class="campo">
              <input id="codigo-grupo" placeholder="Código de invitación" style="text-transform:uppercase" />
            </div>
            <button class="boton boton-primario" id="btn-unirse-grupo" style="width:100%;justify-content:center">Unirme</button>
          </div>
        </div>`;

      if (!grupos.length) {
        html += `<div class="vacio"><div class="icono">👥</div>
          <h3>Todavía no estás en ningún grupo</h3>
          <p>Creá uno y compartí el código, o unite a uno con el código que te pasaron.</p></div>`;
      } else {
        html += `<h2 class="admin-bloque-titulo">Mis grupos</h2>`;
        html += grupos.map(tarjetaGrupo).join("");
      }

      cont.innerHTML = html;
      engancharEventos(cont);

    } catch (err) {
      cont.innerHTML = `<h1 class="titulo">Grupos</h1>
        <div class="vacio"><div class="icono">⚠️</div><h3>No se pudo cargar</h3>
        <p>${esc(err.message)}</p></div>`;
    }
  }

  function engancharEventos(cont) {
    // Crear grupo
    cont.querySelector("#btn-crear-grupo").addEventListener("click", async () => {
      const nombre = cont.querySelector("#nombre-grupo").value.trim();
      if (!nombre) { aviso("Poné un nombre al grupo", "error"); return; }
      try {
        const grupo = await API.crearGrupo(nombre);
        aviso(`Grupo creado · código ${grupo.codigoInvitacion}`, "ok");
        mostrarGrupos(cont);
      } catch (err) { aviso(err.message, "error"); }
    });

    // Unirse con código
    cont.querySelector("#btn-unirse-grupo").addEventListener("click", async () => {
      const codigo = cont.querySelector("#codigo-grupo").value.trim().toUpperCase();
      if (!codigo) { aviso("Ingresá un código", "error"); return; }
      try {
        const grupo = await API.unirseAGrupo(codigo);
        aviso(`Te uniste a "${grupo.nombre}"`, "ok");
        mostrarGrupos(cont);
      } catch (err) {
        // 404 código inexistente · 409 si ya sos miembro.
        aviso(err.message, "error");
      }
    });

    // Copiar código
    cont.querySelectorAll(".btn-copiar").forEach(btn => {
      btn.addEventListener("click", () => copiar(btn.dataset.codigo));
    });

    // Ver / ocultar ranking del grupo
    cont.querySelectorAll(".btn-ranking").forEach(btn => {
      btn.addEventListener("click", () => alternarRanking(btn));
    });
  }

  /* Carga (o esconde) el ranking de un grupo dentro de su tarjeta. */
  async function alternarRanking(btn) {
    const id = btn.dataset.id;
    const zona = document.getElementById("ranking-" + id);

    // Si ya está visible, lo escondemos (toggle).
    if (zona.dataset.abierto === "1") {
      zona.innerHTML = "";
      zona.dataset.abierto = "0";
      btn.textContent = "Ver ranking";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Cargando…";
    try {
      const lista = await API.rankingDeGrupo(id);
      const miNombre = API.obtenerSesion() ? API.obtenerSesion().nombreUsuario : null;
      // tablaPosiciones viene de vista-leaderboard.js (mismo formato del backend).
      zona.innerHTML = lista.length
        ? `<div class="tabla-scroll">${tablaPosiciones(lista, miNombre)}</div>`
        : `<p class="pron-info">El grupo todavía no tiene posiciones.</p>`;
      zona.dataset.abierto = "1";
      btn.textContent = "Ocultar ranking";
    } catch (err) {
      aviso(err.message, "error");
      btn.textContent = "Ver ranking";
    } finally {
      btn.disabled = false;
    }
  }

  // Reemplazamos el placeholder de la Etapa 1.
  Vistas.grupos = mostrarGrupos;

})();
