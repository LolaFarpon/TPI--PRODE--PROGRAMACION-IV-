/* ══════════════════════════════════════════════════════════════════════
   vista-leaderboard.js — Etapa 4: Tabla de posiciones global.
   El backend ya ordena y asigna la "posicion" con los criterios de
   desempate (RF7.2): 1º puntos, 2º resultados exactos, 3º pronóstico más
   antiguo. Acá solo lo mostramos y resaltamos tu fila.

   La función tablaPosiciones() se exporta para reusarla en el ranking de
   grupo (Etapa 5), porque el backend devuelve el MISMO formato.
   ════════════════════════════════════════════════════════════════════════ */

(function () {

  /* Dibuja una tabla de posiciones a partir de la lista del backend.
     Cada item: { posicion, nombreUsuario, puntosTotales, exactos, ... }
     miNombre: para resaltar la fila del usuario logueado. */
  function tablaPosiciones(lista, miNombre) {
    const filas = lista.map(e => {
      // Medalla para el podio.
      const medalla = e.posicion === 1 ? "🥇"
        : e.posicion === 2 ? "🥈"
        : e.posicion === 3 ? "🥉" : "";
      const esYo = miNombre && e.nombreUsuario === miNombre;
      const etiquetaVos = esYo ? ` <span class="vos-tag">vos</span>` : "";

      return `<tr class="${esYo ? "yo" : ""}">
        <td class="pos">${medalla || e.posicion}</td>
        <td>${esc(e.nombreUsuario)}${etiquetaVos}</td>
        <td class="num">${e.puntosTotales}</td>
        <td class="num">${e.exactos}</td>
      </tr>`;
    }).join("");

    return `<table class="tabla">
      <thead><tr>
        <th class="pos">#</th>
        <th>Jugador</th>
        <th class="num">Puntos</th>
        <th class="num">Exactos</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
  }

  /* Vista de la tabla global. */
  async function mostrarLeaderboard(cont) {
    cont.innerHTML = `<p class="eyebrow">Ranking</p><h1 class="titulo">Tabla de posiciones</h1>
      <div class="linea-cancha"></div><p class="cargando">Cargando tabla…</p>`;

    try {
      const lista = await API.obtenerLeaderboard();
      const miNombre = API.obtenerSesion() ? API.obtenerSesion().nombreUsuario : null;

      let html = `<p class="eyebrow">Ranking</p><h1 class="titulo">Tabla de posiciones</h1>
        <div class="linea-cancha"></div>`;

      if (!lista.length) {
        html += `<div class="vacio"><div class="icono">🏆</div>
          <h3>Todavía no hay jugadores</h3>
          <p>Cuando se registren usuarios van a aparecer en la tabla.</p></div>`;
        cont.innerHTML = html;
        return;
      }

      html += `<div class="tabla-scroll">${tablaPosiciones(lista, miNombre)}</div>
        <p class="nota">Ante igualdad de puntos gana quien tenga más resultados exactos;
        si la igualdad sigue, tiene prioridad el pronóstico más antiguo.</p>`;

      cont.innerHTML = html;

    } catch (err) {
      cont.innerHTML = `<h1 class="titulo">Tabla de posiciones</h1>
        <div class="vacio"><div class="icono">⚠️</div><h3>No se pudo cargar</h3>
        <p>${esc(err.message)}</p></div>`;
    }
  }

  // Exportamos la tabla para reusarla en Grupos (Etapa 5).
  window.tablaPosiciones = tablaPosiciones;

  // Reemplazamos el placeholder de la Etapa 1.
  Vistas.leaderboard = mostrarLeaderboard;

})();
