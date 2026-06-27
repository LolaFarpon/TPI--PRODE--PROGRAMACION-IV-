/* ══════════════════════════════════════════════════════════════════════
   vista-admin.js — Etapa 3b: Panel de Gestión (solo ADMIN).
   Tres sub-secciones: Equipos, Fechas y Partidos.
   Desde Partidos se puede crear, iniciar (→ EN_JUEGO) y cargar el resultado
   (→ FINALIZADO + motor de puntos). Con esto se hace la demo completa.
   ════════════════════════════════════════════════════════════════════════ */

(function () {

  // Datos en memoria (se recargan tras cada cambio).
  let estado = { equipos: [], fechas: [], partidos: [] };
  // Sub-sección activa.
  let sub = "equipos";

  /* ══════════ Punto de entrada de la vista ══════════ */
  async function mostrarAdmin(cont) {
    // La nav no muestra "Gestión" a un USER, pero si alguien fuerza la URL,
    // lo cortamos acá (y el backend igual respondería 403 a cada acción).
    if (!API.esAdmin()) {
      cont.innerHTML = `<h1 class="titulo">Gestión</h1>
        <div class="vacio"><div class="icono">🔒</div><h3>Solo para administradores</h3>
        <p>Esta sección es del rol ADMIN.</p></div>`;
      return;
    }

    cont.innerHTML = `<p class="eyebrow">Administración</p><h1 class="titulo">Gestión</h1>
      <div class="linea-cancha"></div><p class="cargando">Cargando…</p>`;

    await recargar(cont);
  }

  /* Vuelve a traer todo del backend y repinta. Se llama tras cada cambio. */
  async function recargar(cont) {
    try {
      const [equipos, fechas, partidos] = await Promise.all([
        API.listarEquipos(), API.listarFechas(), API.listarPartidos(),
      ]);
      estado = { equipos, fechas, partidos };
      pintar(cont);
    } catch (err) {
      cont.innerHTML = `<h1 class="titulo">Gestión</h1>
        <div class="vacio"><div class="icono">⚠️</div><h3>No se pudo cargar</h3>
        <p>${esc(err.message)}</p></div>`;
    }
  }

  /* Dibuja la cabecera + sub-nav + la sección activa, y engancha eventos. */
  function pintar(cont) {
    let html = `<p class="eyebrow">Administración</p><h1 class="titulo">Gestión</h1>
      <div class="subnav">
        ${subTab("equipos", "Equipos")}
        ${subTab("fechas", "Fechas")}
        ${subTab("partidos", "Partidos")}
      </div>`;

    if (sub === "equipos") html += seccionEquipos();
    else if (sub === "fechas") html += seccionFechas();
    else html += seccionPartidos();

    cont.innerHTML = html;

    // Sub-nav: cambiar de sección no recarga datos (ya están en memoria).
    cont.querySelectorAll(".subnav-tab").forEach(t => {
      t.addEventListener("click", () => { sub = t.dataset.sub; pintar(cont); });
    });

    if (sub === "equipos") engancharEquipos(cont);
    else if (sub === "fechas") engancharFechas(cont);
    else engancharPartidos(cont);
  }

  function subTab(clave, texto) {
    return `<button class="subnav-tab ${sub === clave ? "activa" : ""}" data-sub="${clave}">${texto}</button>`;
  }

  /* ══════════ SECCIÓN EQUIPOS ══════════ */
  function seccionEquipos() {
    const lista = estado.equipos.length
      ? `<div class="lista-admin">${estado.equipos.map(e => `
          <div class="item-admin"><span>${esc(e.nombre)}</span>
            <button class="btn-eliminar" data-id="${e.id}" title="Eliminar equipo">✕</button>
          </div>`).join("")}</div>`
      : `<div class="vacio-chico">Todavía no hay equipos.</div>`;

    return `<div class="admin-seccion">
      <div class="form-inline">
        <input id="nuevo-equipo" placeholder="Nombre del equipo (ej: Boca Juniors)" />
        <button class="boton boton-primario" id="btn-add-equipo">Agregar equipo</button>
      </div>
      ${lista}
    </div>`;
  }

  function engancharEquipos(cont) {
    cont.querySelector("#btn-add-equipo").addEventListener("click", async () => {
      const input = cont.querySelector("#nuevo-equipo");
      const nombre = input.value.trim();
      if (!nombre) { aviso("Escribí un nombre", "error"); return; }
      try {
        await API.crearEquipo(nombre);
        aviso("Equipo agregado", "ok");
        recargar(cont);
      } catch (err) { aviso(err.message, "error"); }
    });

    cont.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este equipo?")) return;
        try {
          await API.eliminarEquipo(btn.dataset.id);
          aviso("Equipo eliminado", "ok");
          recargar(cont);
        } catch (err) {
          // Ej: el equipo está asociado a un partido (integridad referencial).
          aviso(err.message, "error");
        }
      });
    });
  }

  /* ══════════ SECCIÓN FECHAS ══════════ */
  function seccionFechas() {
    const lista = estado.fechas.length
      ? `<div class="lista-admin">${estado.fechas.map(f => `
          <div class="item-admin">
            <span>${esc(f.nombre)} ${chipEstado(f.estado)}</span>
            <button class="btn-eliminar" data-id="${f.id}" title="Eliminar fecha">✕</button>
          </div>`).join("")}</div>`
      : `<div class="vacio-chico">Todavía no hay fechas.</div>`;

    return `<div class="admin-seccion">
      <div class="form-inline">
        <input id="nueva-fecha" placeholder="Nombre de la fecha (ej: Fecha 1 - Fase de Grupos)" />
        <button class="boton boton-primario" id="btn-add-fecha">Agregar fecha</button>
      </div>
      ${lista}
    </div>`;
  }

  function engancharFechas(cont) {
    cont.querySelector("#btn-add-fecha").addEventListener("click", async () => {
      const input = cont.querySelector("#nueva-fecha");
      const nombre = input.value.trim();
      if (!nombre) { aviso("Escribí un nombre", "error"); return; }
      try {
        await API.crearFecha(nombre);
        aviso("Fecha agregada", "ok");
        recargar(cont);
      } catch (err) { aviso(err.message, "error"); }
    });

    cont.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar esta fecha?")) return;
        try {
          await API.eliminarFecha(btn.dataset.id);
          aviso("Fecha eliminada", "ok");
          recargar(cont);
        } catch (err) {
          // Ej: la fecha no está PROGRAMADA o tiene partidos asociados.
          aviso(err.message, "error");
        }
      });
    });
  }

  /* ══════════ SECCIÓN PARTIDOS ══════════ */
  function marcadorAdmin(p) {
    if (p.estado === "FINALIZADO" && p.golesLocal != null) {
      return `${p.golesLocal} : ${p.golesVisitante}`;
    }
    return "– : –";
  }

  function etiquetaGanador(p) {
    if (p.ganador === "LOCAL") return esc(p.equipoLocalNombre);
    if (p.ganador === "VISITANTE") return esc(p.equipoVisitanteNombre);
    return "Empate";
  }

  /* Acciones de ADMIN según el estado del partido. */
  function accionesAdmin(p) {
    if (p.estado === "POR_JUGARSE") {
      return `<div class="acciones-fila">
        <button class="boton boton-primario btn-iniciar" data-id="${p.id}">Iniciar partido</button>
        <button class="boton boton-peligro btn-del-partido" data-id="${p.id}">Eliminar</button>
      </div>`;
    }
    if (p.estado === "EN_JUEGO") {
      return `<div class="pron-zone">
        <p class="pron-label">Cargar resultado final</p>
        <div class="pron-inputs" data-id="${p.id}">
          <input type="number" min="0" class="res-local" placeholder="0" aria-label="Goles local" />
          <span class="sep">:</span>
          <input type="number" min="0" class="res-visitante" placeholder="0" aria-label="Goles visitante" />
          <button class="boton boton-primario btn-resultado" data-id="${p.id}">Cargar resultado</button>
        </div>
        <p class="pista-campo">Al cargar el resultado se calculan los puntos automáticamente y el partido pasa a FINALIZADO.</p>
      </div>`;
    }
    // FINALIZADO
    return `<div class="pron-zone"><p class="pron-info">Final: <strong>${p.golesLocal}-${p.golesVisitante}</strong> · Ganó ${etiquetaGanador(p)}</p></div>`;
  }

  function tarjetaAdmin(p) {
    return `<div class="tarjeta partido">
      <div class="partido-top">
        ${chipEstado(p.estado)}
        <span class="partido-hora">${formatearFechaHora(p.horaInicio)}</span>
      </div>
      <div class="marcador">
        <span class="equipo local">${esc(p.equipoLocalNombre)}</span>
        <span class="resultado">${marcadorAdmin(p)}</span>
        <span class="equipo visitante">${esc(p.equipoVisitanteNombre)}</span>
      </div>
      ${accionesAdmin(p)}
    </div>`;
  }

  function seccionPartidos() {
    // Para crear un partido necesitamos al menos 2 equipos y 1 fecha.
    let formulario;
    if (estado.equipos.length < 2 || estado.fechas.length < 1) {
      formulario = `<div class="vacio-chico">
        Para crear partidos, primero cargá al menos <strong>2 equipos</strong> y <strong>1 fecha</strong>.
      </div>`;
    } else {
      const optsFechas = estado.fechas.map(f => `<option value="${f.id}">${esc(f.nombre)}</option>`).join("");
      // El visitante arranca en el 2º equipo para que no coincida con el local por defecto.
      const optsLocal = estado.equipos.map((e, i) => `<option value="${e.id}" ${i === 0 ? "selected" : ""}>${esc(e.nombre)}</option>`).join("");
      const optsVisitante = estado.equipos.map((e, i) => `<option value="${e.id}" ${i === 1 ? "selected" : ""}>${esc(e.nombre)}</option>`).join("");

      formulario = `<div class="tarjeta">
        <p class="pron-label">Nuevo partido</p>
        <div class="grilla-form">
          <div class="campo"><label>Jornada</label><select id="sel-fecha">${optsFechas}</select></div>
          <div class="campo"><label>Local</label><select id="sel-local">${optsLocal}</select></div>
          <div class="campo"><label>Visitante</label><select id="sel-visitante">${optsVisitante}</select></div>
          <div class="campo">
            <label>Día y hora</label>
            <input type="datetime-local" id="sel-hora" />
            <p class="pista-campo">Poné una hora a más de 30 min de ahora para que se pueda pronosticar.</p>
          </div>
        </div>
        <button class="boton boton-primario" id="btn-add-partido">Crear partido</button>
      </div>`;
    }

    const lista = estado.partidos.length
      ? `<h2 class="admin-bloque-titulo">Partidos cargados</h2>${estado.partidos.map(tarjetaAdmin).join("")}`
      : `<h2 class="admin-bloque-titulo">Partidos cargados</h2><div class="vacio-chico">Todavía no hay partidos.</div>`;

    return `<div class="admin-seccion">${formulario}${lista}</div>`;
  }

  function engancharPartidos(cont) {
    // Evitamos elegir una fecha pasada: el mínimo del selector es "ahora".
    const inputHora = cont.querySelector("#sel-hora");
    if (inputHora) {
      const ahoraLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      inputHora.min = ahoraLocal;
    }

    const btnAdd = cont.querySelector("#btn-add-partido");
    if (btnAdd) {
      btnAdd.addEventListener("click", async () => {
        const fechaId = parseInt(cont.querySelector("#sel-fecha").value, 10);
        const local = parseInt(cont.querySelector("#sel-local").value, 10);
        const visitante = parseInt(cont.querySelector("#sel-visitante").value, 10);
        const horaVal = cont.querySelector("#sel-hora").value;

        if (!horaVal) { aviso("Elegí el día y la hora", "error"); return; }
        if (local === visitante) { aviso("El local y el visitante tienen que ser distintos", "error"); return; }

        // datetime-local da hora LOCAL sin zona. new Date la toma como local y
        // toISOString la convierte a UTC (que es lo que espera el backend).
        const horaInicio = new Date(horaVal).toISOString();

        try {
          await API.crearPartido({ fechaId, equipoLocalId: local, equipoVisitanteId: visitante, horaInicio });
          aviso("Partido creado", "ok");
          recargar(cont);
        } catch (err) { aviso(err.message, "error"); }
      });
    }

    // Iniciar partido (→ EN_JUEGO)
    cont.querySelectorAll(".btn-iniciar").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Iniciar el partido? Va a pasar a EN JUEGO y se cierran los pronósticos.")) return;
        try {
          await API.iniciarPartido(btn.dataset.id);
          aviso("Partido en juego", "ok");
          recargar(cont);
        } catch (err) { aviso(err.message, "error"); }
      });
    });

    // Eliminar partido
    cont.querySelectorAll(".btn-del-partido").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar el partido?")) return;
        try {
          await API.eliminarPartido(btn.dataset.id);
          aviso("Partido eliminado", "ok");
          recargar(cont);
        } catch (err) {
          // Ej: el partido tiene pronósticos o no está POR_JUGARSE.
          aviso(err.message, "error");
        }
      });
    });

    // Cargar resultado (→ FINALIZADO + motor de puntos)
    cont.querySelectorAll(".btn-resultado").forEach(btn => {
      btn.addEventListener("click", async () => {
        const fila = btn.closest(".pron-inputs");
        const vl = fila.querySelector(".res-local").value;
        const vv = fila.querySelector(".res-visitante").value;
        if (vl === "" || vv === "") { aviso("Completá los dos resultados", "error"); return; }
        const gl = parseInt(vl, 10), gv = parseInt(vv, 10);
        if (Number.isNaN(gl) || Number.isNaN(gv) || gl < 0 || gv < 0) {
          aviso("Los goles tienen que ser 0 o más", "error"); return;
        }
        if (!confirm("¿Cargar el resultado? Se calculan los puntos y el partido queda FINALIZADO.")) return;
        try {
          await API.cargarResultado(btn.dataset.id, gl, gv);
          aviso("Resultado cargado · puntos actualizados ⚽", "ok");
          recargar(cont);
        } catch (err) { aviso(err.message, "error"); }
      });
    });
  }

  // Reemplazamos el placeholder de la Etapa 1.
  Vistas.admin = mostrarAdmin;

})();
