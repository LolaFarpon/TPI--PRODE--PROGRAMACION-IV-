/* ══════════════════════════════════════════════════════════════════════
   vista-partidos.js — Etapa 3 (lado USER):
   - Listado de partidos agrupado por jornada.
   - Cargar / editar pronóstico (respetando el bloqueo de 30 min).
   - Ver pronósticos de los demás (una vez cerrado el bloqueo).
   - Vista "Mis pronósticos" con resumen de puntos.
   Reemplaza los placeholders Vistas.partidos y Vistas.misPronosticos.
   ════════════════════════════════════════════════════════════════════════ */

(function () {

  /* ¿El partido ya está cerrado para pronosticar?
     Cerrado = falta media hora o menos para el inicio (o ya empezó).
     OJO: este cálculo es del lado del cliente, solo para mostrar/ocultar el
     formulario. La verdad la tiene el backend, que rechaza con 400 si te
     pasaste. Por eso igual atrapamos ese error al guardar. */
  function estaBloqueado(horaInicioIso) {
    const inicio = new Date(horaInicioIso).getTime();
    const limite = inicio - 30 * 60 * 1000;   // 30 min antes
    return Date.now() >= limite;
  }

  /* Marcador central de la tarjeta:
     - FINALIZADO -> el resultado real.
     - Si no, "– : –". */
  function marcadorCentral(p) {
    if (p.estado === "FINALIZADO" && p.golesLocal != null) {
      return `${p.golesLocal} : ${p.golesVisitante}`;
    }
    return "– : –";
  }

  /* Clases para resaltar al ganador en un partido finalizado. */
  function claseEquipo(p, lado) {
    if (p.estado !== "FINALIZADO" || !p.ganador) return "";
    if (p.ganador === "EMPATE") return "";
    if (lado === "local") return p.ganador === "LOCAL" ? "gano" : "perdio";
    return p.ganador === "VISITANTE" ? "gano" : "perdio";
  }

  /* Dibuja la zona de pronóstico de una tarjeta, según el estado del partido
     y si el usuario ya tiene un pronóstico cargado. */
  function zonaPronostico(p, miPron, soyUser) {
    // El ADMIN no pronostica.
    if (!soyUser) {
      return p.estado === "FINALIZADO"
        ? `<p class="pron-info">Resultado cargado.</p>`
        : `<p class="pron-info">Gestionás este partido desde el panel de Gestión.</p>`;
    }

    const bloqueado = estaBloqueado(p.horaInicio);
    const tengo = !!miPron;

    // CASO 1: se puede pronosticar (POR_JUGARSE y todavía no se cerró).
    if (p.estado === "POR_JUGARSE" && !bloqueado) {
      const gl = tengo ? miPron.golesLocal : "";
      const gv = tengo ? miPron.golesVisitante : "";
      const textoBoton = tengo ? "Actualizar" : "Guardar";
      return `
        <div class="pron-zone">
          <p class="pron-label">${tengo ? "Tu pronóstico (podés cambiarlo)" : "Cargá tu pronóstico"}</p>
          <div class="pron-inputs" data-partido="${p.id}">
            <input type="number" min="0" class="in-local" value="${gl}" aria-label="Goles ${esc(p.equipoLocalNombre)}" />
            <span class="sep">:</span>
            <input type="number" min="0" class="in-visitante" value="${gv}" aria-label="Goles ${esc(p.equipoVisitanteNombre)}" />
            <button class="boton boton-primario btn-guardar" data-partido="${p.id}">${textoBoton}</button>
          </div>
        </div>`;
    }

    // CASO 2: ya cerró o el partido arrancó/terminó -> solo lectura.
    let linea;
    if (p.estado === "FINALIZADO" && tengo) {
      const pts = miPron.puntosObtenidos;
      const clase = pts === 3 ? "p3" : pts === 1 ? "p1" : "p0";
      linea = `Tu pronóstico: <strong>${miPron.golesLocal}-${miPron.golesVisitante}</strong> · <span class="pron-puntos ${clase}">${pts} pts</span>`;
    } else if (tengo) {
      const candado = (p.estado === "POR_JUGARSE") ? " 🔒" : "";
      linea = `Tu pronóstico: <strong>${miPron.golesLocal}-${miPron.golesVisitante}</strong>${candado}`;
    } else {
      linea = (p.estado === "POR_JUGARSE")
        ? "Pronósticos cerrados 🔒"
        : "No pronosticaste este partido";
    }

    // Botón "ver los demás" cuando ya cerró el bloqueo (privacidad: HU-18).
    const verDemas = estaBloqueado(p.horaInicio)
      ? `<button class="btn-terceros" data-partido="${p.id}">Ver pronósticos de los demás</button>
         <div class="terceros-zona" id="terceros-${p.id}"></div>`
      : "";

    return `<div class="pron-zone"><p class="pron-info">${linea}</p>${verDemas}</div>`;
  }

  /* Dibuja una tarjeta de partido. */
  function tarjetaPartido(p, miPron, soyUser) {
    return `
      <div class="tarjeta partido">
        <div class="partido-top">
          ${chipEstado(p.estado)}
          <span class="partido-hora">${formatearFechaHora(p.horaInicio)}</span>
        </div>
        <div class="marcador">
          <span class="equipo local ${claseEquipo(p, "local")}">${esc(p.equipoLocalNombre)}</span>
          <span class="resultado">${marcadorCentral(p)}</span>
          <span class="equipo visitante ${claseEquipo(p, "visitante")}">${esc(p.equipoVisitanteNombre)}</span>
        </div>
        ${zonaPronostico(p, miPron, soyUser)}
      </div>`;
  }

  /* ══════════ VISTA PRINCIPAL: PARTIDOS ══════════ */
  async function mostrarPartidos(cont) {
    cont.innerHTML = `<p class="eyebrow">Fixture</p><h1 class="titulo">Partidos</h1>
      <div class="linea-cancha"></div><p class="cargando">Cargando partidos…</p>`;

    const soyUser = !API.esAdmin();

    try {
      // Traemos los partidos y, si soy USER, mis pronósticos en paralelo.
      const [partidos, mios] = await Promise.all([
        API.listarPartidos(),
        soyUser ? API.misPronosticos() : Promise.resolve([]),
      ]);

      // Mapa partidoId -> mi pronóstico, para cruzarlo rápido.
      const mapaPron = {};
      mios.forEach(pr => { mapaPron[pr.partidoId] = pr; });

      // Cabecera
      let html = `<p class="eyebrow">Fixture</p><h1 class="titulo">Partidos</h1>
        <div class="linea-cancha"></div>`;

      if (!partidos.length) {
        html += `<div class="vacio"><div class="icono">📋</div>
          <h3>Todavía no hay partidos</h3>
          <p>${soyUser ? "Cuando el admin cargue partidos, van a aparecer acá." : "Cargá equipos, fechas y partidos desde el panel de Gestión."}</p></div>`;
        cont.innerHTML = html;
        return;
      }

      // Agrupamos por jornada (fecha), respetando el orden que ya trae el backend.
      const jornadas = [];
      const indice = {};
      partidos.forEach(p => {
        if (!(p.fechaId in indice)) {
          indice[p.fechaId] = jornadas.length;
          jornadas.push({ nombre: p.fechaNombre, partidos: [] });
        }
        jornadas[indice[p.fechaId]].partidos.push(p);
      });

      jornadas.forEach(j => {
        html += `<div class="jornada">
          <h2 class="jornada-titulo">${esc(j.nombre)}</h2>
          ${j.partidos.map(p => tarjetaPartido(p, mapaPron[p.id], soyUser)).join("")}
        </div>`;
      });

      cont.innerHTML = html;

      // ── Enganchamos los eventos después de pintar el HTML ──

      // Guardar pronóstico
      cont.querySelectorAll(".btn-guardar").forEach(btn => {
        btn.addEventListener("click", () => guardarPronostico(btn, cont));
      });
      // Ver pronósticos de los demás
      cont.querySelectorAll(".btn-terceros").forEach(btn => {
        btn.addEventListener("click", () => verTerceros(btn));
      });

    } catch (err) {
      cont.innerHTML = `<h1 class="titulo">Partidos</h1>
        <div class="vacio"><div class="icono">⚠️</div><h3>No se pudo cargar</h3>
        <p>${esc(err.message)}</p></div>`;
    }
  }

  /* Guarda (o actualiza) el pronóstico de un partido. */
  async function guardarPronostico(btn, cont) {
    const partidoId = btn.dataset.partido;
    const fila = btn.closest(".pron-inputs");
    const vLocal = fila.querySelector(".in-local").value;
    const vVisit = fila.querySelector(".in-visitante").value;

    if (vLocal === "" || vVisit === "") {
      aviso("Completá los dos resultados", "error");
      return;
    }
    const gl = parseInt(vLocal, 10);
    const gv = parseInt(vVisit, 10);
    if (Number.isNaN(gl) || Number.isNaN(gv) || gl < 0 || gv < 0) {
      aviso("Los goles tienen que ser 0 o más", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Guardando…";
    try {
      await API.guardarPronostico(partidoId, gl, gv);
      aviso("Pronóstico guardado ⚽", "ok");
      mostrarPartidos(cont);   // recargamos para reflejar el cambio
    } catch (err) {
      // Ej: si justo se pasó el bloqueo de 30 min, el backend devuelve 400.
      aviso(err.message, "error");
      btn.disabled = false;
      btn.textContent = "Guardar";
    }
  }

  /* Muestra los pronósticos de los demás para un partido. */
  async function verTerceros(btn) {
    const partidoId = btn.dataset.partido;
    const zona = document.getElementById("terceros-" + partidoId);
    btn.disabled = true;
    btn.textContent = "Cargando…";
    try {
      const lista = await API.pronosticosDePartido(partidoId);
      if (!lista.length) {
        zona.innerHTML = `<p class="pron-info">Nadie más pronosticó este partido.</p>`;
      } else {
        // El backend devuelve los goles pero no el nombre del que pronosticó.
        zona.innerHTML = `<div class="terceros">` +
          lista.map(p => `<span class="tercero">${p.golesLocal}-${p.golesVisitante}</span>`).join("") +
          `</div>`;
      }
      btn.style.display = "none";   // ya los mostramos
    } catch (err) {
      // 403 si todavía no se cumplió el bloqueo (no debería pasar acá, pero por las dudas).
      zona.innerHTML = `<p class="pron-info">${esc(err.message)}</p>`;
      btn.disabled = false;
      btn.textContent = "Ver pronósticos de los demás";
    }
  }

  /* ══════════ VISTA: MIS PRONÓSTICOS ══════════ */
  async function mostrarMisPronosticos(cont) {
    cont.innerHTML = `<p class="eyebrow">Mi historial</p><h1 class="titulo">Mis pronósticos</h1>
      <div class="linea-cancha"></div><p class="cargando">Cargando…</p>`;

    try {
      // Cruzamos mis pronósticos con la info de los partidos (nombres, estado).
      const [mios, partidos] = await Promise.all([
        API.misPronosticos(),
        API.listarPartidos(),
      ]);
      const mapaPartido = {};
      partidos.forEach(p => { mapaPartido[p.id] = p; });

      let html = `<p class="eyebrow">Mi historial</p><h1 class="titulo">Mis pronósticos</h1>`;

      if (!mios.length) {
        html += `<div class="linea-cancha"></div>
          <div class="vacio"><div class="icono">🎯</div>
          <h3>Todavía no pronosticaste</h3>
          <p>Andá a <a href="#/partidos" style="color:var(--ambar)">Partidos</a> y cargá tu primer pronóstico.</p></div>`;
        cont.innerHTML = html;
        return;
      }

      // Resumen: puntos totales y aciertos exactos.
      const totalPuntos = mios.reduce((s, p) => s + (p.puntosObtenidos || 0), 0);
      const exactos = mios.filter(p => p.puntosObtenidos === 3).length;

      html += `
        <div class="resumen">
          <div class="stat"><div class="n">${totalPuntos}</div><div class="l">Puntos</div></div>
          <div class="stat"><div class="n">${exactos}</div><div class="l">Resultados exactos</div></div>
          <div class="stat"><div class="n">${mios.length}</div><div class="l">Pronósticos</div></div>
        </div>
        <div class="tabla-scroll"><table class="tabla">
          <thead><tr>
            <th>Partido</th><th>Tu pronóstico</th><th>Resultado</th>
            <th class="num">Pts</th><th>Estado</th>
          </tr></thead><tbody>`;

      mios.forEach(pr => {
        const p = mapaPartido[pr.partidoId];
        const nombrePartido = p
          ? `${esc(p.equipoLocalNombre)} vs ${esc(p.equipoVisitanteNombre)}`
          : `Partido #${pr.partidoId}`;
        const resultadoReal = (p && p.estado === "FINALIZADO" && p.golesLocal != null)
          ? `${p.golesLocal}-${p.golesVisitante}` : "—";
        const pts = pr.puntosObtenidos || 0;
        const clasePts = pts === 3 ? "p3" : pts === 1 ? "p1" : "p0";
        const estadoCol = p ? chipEstado(p.estado) : "—";

        html += `<tr>
          <td>${nombrePartido}</td>
          <td><strong>${pr.golesLocal}-${pr.golesVisitante}</strong></td>
          <td>${resultadoReal}</td>
          <td class="num"><span class="pron-puntos ${clasePts}">${pts}</span></td>
          <td>${estadoCol}</td>
        </tr>`;
      });

      html += `</tbody></table></div>`;
      cont.innerHTML = html;

    } catch (err) {
      cont.innerHTML = `<h1 class="titulo">Mis pronósticos</h1>
        <div class="vacio"><div class="icono">⚠️</div><h3>No se pudo cargar</h3>
        <p>${esc(err.message)}</p></div>`;
    }
  }

  // Reemplazamos los placeholders de la Etapa 1.
  Vistas.partidos = mostrarPartidos;
  Vistas.misPronosticos = mostrarMisPronosticos;

})();
